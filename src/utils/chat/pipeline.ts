/**
 * Chat pipeline: gate -> classify -> stream with output guard. Pure of Cloudflare
 * bindings so it can be unit-tested with fake models.
 */
import {
  createUIMessageStream,
  type UIMessage,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { createStreamGuard } from './guard';
import { NO_THINKING, chatModels, classifyScope, isFallbackError } from './models';
import {
  POST_UNAVAILABLE,
  REFUSAL,
  UNAVAILABLE,
  buildMessages,
  newCanary,
  postAskSystemPrompt,
  postClassifierInput,
  postContextBlock,
  postRefusal,
  postSummarySystemPrompt,
  systemPrompt,
} from './prompt';
import {
  fallbackChunks,
  noteHeadings,
  noteSource,
  noteText,
  postUrl,
  type PostNote,
} from './post-context';
import { topicGate, type Chunk } from './retrieve';
import type { ChatMessage } from './schema';

export interface PipelineDeps {
  models: ReturnType<typeof chatModels>;
  providerTimeoutMs?: number;
  onEvent?: (event: string, detail?: Record<string, unknown>) => void;
}

/** What the pipeline actually did for one answer; rendered by the UI as the trace line. */
export interface ChatTrace {
  scope: 'meta' | 'classifier' | 'unavailable' | 'post';
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

/** Everything that differs between scopes; the streaming, fallback and guard loop is shared. */
interface AnswerPlan {
  scope: ChatTrace['scope'];
  system: (canary: string) => string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  sources: Chunk[];
  refusal: string;
  unavailable: string;
  /** Called with the guarded text of a completed, unblocked answer (summary memoization). */
  onAnswered?: (text: string) => Promise<void>;
}

function streamAnswer(
  plan: AnswerPlan,
  models: PipelineDeps['models'],
  deps: PipelineDeps,
  abortSignal?: AbortSignal,
): Response {
  const { onEvent } = deps;
  const { scope, sources: chunks } = plan;
  const canary = newCanary();

  // Stream from the first provider that starts; fall through only on quota/capacity errors.
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
        const guard = createStreamGuard(canary, '\n\n' + plan.refusal, (v) =>
          onEvent?.('output_blocked', { violation: v, provider: name }),
        );
        let started = false;
        let shown = '';
        const providerSignal = AbortSignal.any([
          ...(abortSignal ? [abortSignal] : []),
          AbortSignal.timeout(deps.providerTimeoutMs ?? 30_000),
        ]);
        try {
          const result = streamText({
            model,
            system: plan.system(canary),
            messages: plan.messages,
            temperature: 0.2,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            maxRetries: 0,
            // Reasoning models would spend the whole output budget thinking.
            reasoning: 'none',
            providerOptions: NO_THINKING,
            abortSignal: providerSignal,
            // Surface errors through fullStream; never print prompt content.
            onError: () => {},
          });
          const emit = (delta: string) => {
            if (!started) writer.write({ type: 'text-start', id: 't' });
            started = true;
            shown += delta;
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
          if (!guard.tripped) await plan.onAnswered?.(shown);
          return;
        } catch (err) {
          onEvent?.('provider_error', {
            provider: name,
            status: (err as { statusCode?: number })?.statusCode,
          });
          // Can only fall back if nothing has been shown yet.
          if (
            !started &&
            !abortSignal?.aborted &&
            i < models.length - 1 &&
            isFallbackError(providerSignal.aborted ? providerSignal.reason : err)
          )
            continue;
          trace({ verdict: started ? 'interrupted' : 'unavailable', provider: name });
          if (!started) writer.write({ type: 'text-start', id: 't' });
          writer.write({ type: 'text-delta', id: 't', delta: started ? '' : plan.unavailable });
          writer.write({ type: 'text-end', id: 't' });
          return;
        }
      }
    },
    onError: () => plan.unavailable,
  });
  return createUIMessageStreamResponse({ stream, headers: NO_STORE });
}

export async function runChat(
  question: string,
  history: ChatMessage[],
  deps: PipelineDeps,
  abortSignal?: AbortSignal,
): Promise<Response> {
  const { models, onEvent } = deps;
  if (models.length === 0)
    return textResponse(UNAVAILABLE, 'unavailable', {
      scope: 'unavailable',
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
  return streamAnswer(
    {
      scope: gate.kind === 'classify' ? 'classifier' : 'meta',
      system: systemPrompt,
      messages: buildMessages(history, question, chunks),
      sources: chunks,
      refusal: REFUSAL,
      unavailable: UNAVAILABLE,
    },
    models,
    deps,
    abortSignal,
  );
}

export interface PostChatInput {
  mode: 'ask' | 'summary';
  note: PostNote;
  /** Required for `ask`; already sanitized by the endpoint. */
  question?: string;
  /** Summary mode only: receives the guarded text of a completed summary so it can be cached. */
  onSummary?: (text: string) => Promise<void>;
}

/**
 * Post scope. Summary skips the classifier (the server chose the note, not the reader) and uses the
 * note alone. Ask always goes through the classifier with a note-aware input, then answers from the
 * whole note with up to two other pages as a labelled fallback.
 */
export async function runPostChat(
  input: PostChatInput,
  deps: PipelineDeps,
  abortSignal?: AbortSignal,
): Promise<Response> {
  const { models, onEvent } = deps;
  const { note, mode } = input;
  if (models.length === 0)
    return textResponse(POST_UNAVAILABLE, 'unavailable', {
      scope: 'post',
      verdict: 'unavailable',
      sources: 0,
    });

  const self = { title: note.title, url: postUrl(note), text: noteText(note) };

  if (mode === 'summary')
    return streamAnswer(
      {
        scope: 'post',
        system: postSummarySystemPrompt,
        messages: [{ role: 'user', content: `${postContextBlock(self)}\n\nWrite the summary.` }],
        sources: [noteSource(note)],
        refusal: postRefusal(note.title),
        unavailable: POST_UNAVAILABLE,
        onAnswered: input.onSummary,
      },
      models,
      deps,
      abortSignal,
    );

  const question = input.question ?? '';
  const verdict = await classifyScope(
    models,
    question,
    [note.title],
    postClassifierInput(question, note.title, noteHeadings(note)),
  );
  if (verdict !== 'yes') {
    onEvent?.(verdict === 'no' ? 'refused' : 'classifier_error', {
      stage: 'classifier',
      scope: 'post',
    });
    return verdict === 'no'
      ? textResponse(postRefusal(note.title), 'refusal', {
          scope: 'post',
          verdict: 'refused',
          sources: 0,
        })
      : textResponse(POST_UNAVAILABLE, 'unavailable', {
          scope: 'post',
          verdict: 'unavailable',
          sources: 0,
        });
  }
  const { related, facts } = fallbackChunks(note, question);
  return streamAnswer(
    {
      scope: 'post',
      system: postAskSystemPrompt,
      messages: [
        {
          role: 'user',
          content: `${postContextBlock(self, related, facts)}\n\nQuestion: ${question}`,
        },
      ],
      sources: [noteSource(note), ...related],
      refusal: postRefusal(note.title),
      unavailable: POST_UNAVAILABLE,
    },
    models,
    deps,
    abortSignal,
  );
}

/** A cached summary replayed as the normal stream; no model call. */
export function replaySummary(text: string, note: PostNote): Response {
  const source = noteSource(note);
  const stream = createUIMessageStream<ChatUIMessage>({
    execute({ writer }) {
      writer.write({
        type: 'data-trace',
        id: 'trace',
        data: {
          scope: 'post',
          verdict: 'answered',
          sources: 1,
          provider: 'cache',
          guard: 'passed',
        },
      });
      writer.write({ type: 'text-start', id: 't' });
      writer.write({ type: 'text-delta', id: 't', delta: text });
      writer.write({ type: 'text-end', id: 't' });
      writer.write({
        type: 'source-url',
        sourceId: source.id,
        url: `https://piyushmehta.com${source.url}`,
        title: source.title,
      });
    },
  });
  return createUIMessageStreamResponse({
    stream,
    headers: { ...NO_STORE, 'X-Chat-Source': 'cache' },
  });
}
