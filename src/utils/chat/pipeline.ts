/**
 * Chat pipeline: gate -> classify -> stream with output guard. Pure of Cloudflare
 * bindings so it can be unit-tested with fake models.
 */
import {
  createUIMessageStream,
  type UIMessage,
  createUIMessageStreamResponse,
  streamText,
  type LanguageModel,
} from 'ai';
import { createStreamGuard } from './guard';
import { NO_THINKING, classifyScope, isFallbackError } from './models';
import { REFUSAL, UNAVAILABLE, buildMessages, newCanary, systemPrompt } from './prompt';
import { topicGate, type Chunk } from './retrieve';
import type { ChatMessage } from './schema';

export interface PipelineDeps {
  models: { name: string; model: LanguageModel }[];
  onEvent?: (event: string, detail?: Record<string, unknown>) => void;
}

/** What the pipeline actually did for one answer; rendered by the UI as the trace line. */
export interface ChatTrace {
  scope: 'meta' | 'classifier';
  verdict: 'answered' | 'refused' | 'unavailable' | 'interrupted';
  sources: number;
  provider?: string;
  guard?: 'passed' | 'blocked';
}
export type ChatUIMessage = UIMessage<unknown, { trace: ChatTrace }>;

const MAX_OUTPUT_TOKENS = 400;
const NO_STORE = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

function textResponse(text: string, source: string, trace: ChatTrace) {
  const stream = createUIMessageStream<ChatUIMessage>({
    execute({ writer }) {
      writer.write({ type: 'data-trace', id: 'trace', data: trace });
      writer.write({ type: 'text-start', id: 't' });
      writer.write({ type: 'text-delta', id: 't', delta: text });
      writer.write({ type: 'text-end', id: 't' });
    },
  });
  return createUIMessageStreamResponse({
    stream,
    headers: { ...NO_STORE, 'X-Chat-Source': source },
  });
}

const dedupe = (chunks: Chunk[]) =>
  [...new Map(chunks.map((c) => [c.url, c])).values()].slice(0, 3);

export async function runChat(
  question: string,
  history: ChatMessage[],
  deps: PipelineDeps,
  abortSignal?: AbortSignal,
): Promise<Response> {
  const { models, onEvent } = deps;
  if (models.length === 0)
    return textResponse(UNAVAILABLE, 'unavailable', {
      scope: 'meta',
      verdict: 'unavailable',
      sources: 0,
    });

  // 1. Greetings pass; every other question needs an explicit YES from the classifier.
  const gate = topicGate(question);
  if (gate.kind === 'classify') {
    const verdict = await classifyScope(
      models,
      question,
      gate.chunks.map((c) => c.title),
    );
    if (verdict !== 'yes') {
      onEvent?.(verdict === 'no' ? 'refused' : 'classifier_error', { stage: 'classifier' });
      return verdict === 'no'
        ? textResponse(REFUSAL, 'refusal', { scope: 'classifier', verdict: 'refused', sources: 0 })
        : textResponse(UNAVAILABLE, 'unavailable', {
            scope: 'classifier',
            verdict: 'unavailable',
            sources: 0,
          });
    }
  }
  const chunks = gate.chunks;
  const scope: ChatTrace['scope'] = gate.kind === 'classify' ? 'classifier' : 'meta';
  const canary = newCanary();
  const messages = buildMessages(history, question, chunks);

  // 2. Stream from the first provider that starts; fall through only on quota/capacity errors.
  const stream = createUIMessageStream<ChatUIMessage>({
    async execute({ writer }) {
      const sourceCount = dedupe(chunks).length;
      const trace = (extra: Partial<ChatTrace> = {}) =>
        writer.write({
          type: 'data-trace',
          id: 'trace',
          data: { scope, verdict: 'answered', sources: sourceCount, ...extra },
        });
      trace();
      for (const [i, { name, model }] of models.entries()) {
        const guard = createStreamGuard(canary, '\n\n' + REFUSAL, (v) =>
          onEvent?.('output_blocked', { violation: v, provider: name }),
        );
        let started = false;
        try {
          const result = streamText({
            model,
            system: systemPrompt(canary),
            messages,
            temperature: 0.2,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            maxRetries: 0,
            // Reasoning models would spend the whole output budget thinking.
            reasoning: 'none',
            providerOptions: NO_THINKING,
            abortSignal,
            // Surface errors through fullStream; never print prompt content.
            onError: () => {},
          });
          const emit = (delta: string) => {
            if (!started) writer.write({ type: 'text-start', id: 't' });
            started = true;
            writer.write({ type: 'text-delta', id: 't', delta });
          };
          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
              const out = guard.push(part.text);
              if (out) emit(out);
              if (guard.tripped) break;
            } else if (part.type === 'error') {
              throw part.error;
            }
          }
          const tail = guard.flush();
          if (tail) emit(tail);
          // An empty completion is a provider failure, not an answer.
          if (!started && !guard.tripped)
            throw Object.assign(new Error('empty completion'), { statusCode: 503 });
          writer.write({ type: 'text-end', id: 't' });
          if (!guard.tripped)
            for (const s of dedupe(chunks))
              writer.write({
                type: 'source-url',
                sourceId: s.id,
                url: `https://piyushmehta.com${s.url}`,
                title: s.title,
              });
          trace({
            provider: name,
            guard: guard.tripped ? 'blocked' : 'passed',
            sources: guard.tripped ? 0 : sourceCount,
          });
          onEvent?.('answered', { provider: name, chunks: chunks.length });
          return;
        } catch (err) {
          onEvent?.('provider_error', {
            provider: name,
            status: (err as { statusCode?: number })?.statusCode,
          });
          // Can only fall back if nothing has been shown yet.
          if (!started && i < models.length - 1 && isFallbackError(err)) continue;
          trace({ verdict: started ? 'interrupted' : 'unavailable', provider: name });
          if (!started) writer.write({ type: 'text-start', id: 't' });
          writer.write({ type: 'text-delta', id: 't', delta: started ? '' : UNAVAILABLE });
          writer.write({ type: 'text-end', id: 't' });
          return;
        }
      }
    },
    onError: () => UNAVAILABLE,
  });
  return createUIMessageStreamResponse({ stream, headers: NO_STORE });
}
