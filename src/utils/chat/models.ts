/** Provider chain: Workers AI (free quota) -> Groq (free) -> none. All IDs live here. */
import { createGroq } from '@ai-sdk/groq';
import { generateText, type LanguageModel } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';
import { CLASSIFIER_PROMPT, classifierInput } from './prompt';

export const MODELS = {
  primary: '@cf/ibm-granite/granite-4.0-h-micro',
  classifier: '@cf/google/gemma-4-26b-a4b-it',
  fallback: 'openai/gpt-oss-20b',
} as const;

/** Disable chat-template thinking on Workers AI models that support it (Gemma 4, Qwen 3). */
export const NO_THINKING = {
  'workers-ai': { reasoning_effort: null, chat_template_kwargs: { enable_thinking: false } },
} as const;

export interface ChatEnv {
  ai?: Ai;
  groqKey?: string;
}

export function chatModels(
  env: ChatEnv,
): { name: string; model: LanguageModel; classifier?: LanguageModel }[] {
  const out: ReturnType<typeof chatModels> = [];
  if (env.ai) {
    const workers = createWorkersAI({ binding: env.ai });
    // Granite handles answers cheaply; Gemma keeps the scope decision reliable.
    out.push({
      name: 'workers-ai',
      model: workers(MODELS.primary),
      classifier: workers(MODELS.classifier),
    });
  }
  if (env.groqKey)
    out.push({ name: 'groq', model: createGroq({ apiKey: env.groqKey })(MODELS.fallback) });
  return out;
}

/** Quota/capacity errors where trying the next provider is appropriate. */
export function isFallbackError(err: unknown): boolean {
  const e = err as { statusCode?: number; message?: string } | undefined;
  if (e?.statusCode === 429 || (e?.statusCode ?? 0) >= 500) return true;
  return /4006|quota|rate.?limit|capacity|overloaded|timeout/i.test(String(e?.message ?? ''));
}

export type ScopeVerdict = 'yes' | 'no' | 'error';

/**
 * Scope classifier. Fails closed: only an exact "YES" is in scope. The question is
 * its own user turn so it cannot close a quoted block and append an answer.
 * Tries each provider; 'error' means no provider could classify (not a refusal).
 */
export async function classifyScope(
  models: { model: LanguageModel; classifier?: LanguageModel }[],
  question: string,
  pageTitles: string[] = [],
): Promise<ScopeVerdict> {
  for (const { model, classifier } of models) {
    try {
      const { text } = await generateText({
        model: classifier ?? model,
        system: CLASSIFIER_PROMPT,
        messages: [{ role: 'user', content: classifierInput(question, pageTitles) }],
        // Small buffer: some models emit a short reasoning prefix even with thinking off.
        maxOutputTokens: 32,
        temperature: 0,
        reasoning: 'none',
        providerOptions: NO_THINKING,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(8000),
      });
      return /^\s*yes\s*[.!]?\s*$/i.test(text) ? 'yes' : 'no';
    } catch (err) {
      if (!isFallbackError(err)) return 'error';
    }
  }
  return 'error';
}
