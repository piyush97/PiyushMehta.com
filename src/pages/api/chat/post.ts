import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import { isAllowedFormOrigin, json, readLimitedText } from '@/utils/request-security';
import { recordConversion, runInBackground } from '@/utils/conversions';
import {
  createRatelimit,
  getClientIp,
  limitOrUnavailable,
  reactionRedis,
  redis,
} from '@/utils/redis';
import { chatModels } from '@/utils/chat/models';
import { replaySummary, runPostChat } from '@/utils/chat/pipeline';
import { getPostNote } from '@/utils/chat/post-context';
import { MAX_BODY_BYTES, parsePostChatRequest } from '@/utils/chat/schema';
import { MAX_MESSAGE_CHARS, sanitizeUserText } from '@/utils/chat/sanitize';
import { verifySession } from '@/utils/chat/session';
import {
  readSummary,
  summaryKey,
  writeSummary,
  type SummaryStore,
} from '@/utils/chat/summary-cache';

export const prerender = false;

// Per-IP request caps. Summary requests count cache hits too, so the daily cap sits above the
// 56-note worst case; generation pressure is bounded by the global miss cap below.
const askMinute = createRatelimit('ratelimit:chat-post:ask:min', 4, '1 m');
const askDay = createRatelimit('ratelimit:chat-post:ask:day', 20, '1 d');
const summaryMinute = createRatelimit('ratelimit:chat-post:summary:min', 4, '1 m');
const summaryDay = createRatelimit('ratelimit:chat-post:summary:day', 60, '1 d');
// Global caps. Their own buckets: post scope can never spend the site-scope `/api/chat` budget.
const askGlobal = createRatelimit('ratelimit:chat-post:ask:global', 100, '1 d');
const summaryGlobal = createRatelimit('ratelimit:chat-post:summary:global', 60, '1 d');

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  try {
    if (!isAllowedFormOrigin(request)) return json({ error: 'Forbidden.' }, 403);

    const text = await readLimitedText(request, MAX_BODY_BYTES);
    if (text === null) return json({ error: 'Request too large.' }, 413);

    // Fail closed: every protection below must be configured before any quota is spent.
    const sessionSecret = ENV.CHAT_SESSION_SECRET;
    if (
      !sessionSecret ||
      !ENV.TURNSTILE_SECRET_KEY ||
      !redis ||
      !askMinute ||
      !askDay ||
      !summaryMinute ||
      !summaryDay ||
      !askGlobal ||
      !summaryGlobal
    )
      return json({ error: 'Chat unavailable.' }, 503);

    const ip = getClientIp(request, clientAddress);
    if (!ip) return json({ error: 'Client address required.' }, 400);
    const session = request.headers.get('x-chat-session') ?? '';
    if (!(await verifySession(sessionSecret, session, ip)))
      return json({ error: 'Session required.' }, 401);

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: 'Invalid request.' }, 400);
    }
    // Shape errors cost no quota; the mode picks which per-IP buckets apply.
    const parsed = parsePostChatRequest(body);
    if (!parsed.ok) return json({ error: 'Invalid request.' }, 422);
    const { post, mode } = parsed.value;

    const [perMinute, perDay] =
      mode === 'summary' ? [summaryMinute, summaryDay] : [askMinute, askDay];
    const limitError =
      (await limitOrUnavailable(perMinute, ip)) ?? (await limitOrUnavailable(perDay, ip));
    if (limitError) return limitError;

    const note = getPostNote(post);
    if (!note) return json({ error: 'Unknown post.' }, 422);

    const models = () => chatModels({ ai: (cfEnv as { AI?: Ai }).AI, groqKey: ENV.GROQ_API_KEY });
    const onEvent = (e: string, detail?: Record<string, unknown>) =>
      console.info('[chat-post]', mode, e, JSON.stringify(detail ?? {}));

    if (mode === 'summary') {
      const key = summaryKey(note.slug, note.digest);
      const store = redis as unknown as SummaryStore;
      const cached = await readSummary(key, store);
      // A broken cache must not turn every open into a model call.
      if (!cached.ok) return json({ error: 'Chat unavailable.' }, 503, { 'Retry-After': '30' });
      if (cached.text !== null) return replaySummary(cached.text, note);

      // Only a miss spends the global generation budget.
      const capError = await limitOrUnavailable(summaryGlobal, 'all');
      if (capError) return capError;
      return await runPostChat(
        {
          mode,
          note,
          onSummary: async (summary) => {
            await writeSummary(key, summary, store);
          },
        },
        { models: models(), onEvent },
        request.signal,
      );
    }

    const question = sanitizeUserText(parsed.value.question ?? '');
    if (question.length === 0 || question.length > MAX_MESSAGE_CHARS)
      return json({ error: `Questions must be 1-${MAX_MESSAGE_CHARS} characters.` }, 422);
    const capError = await limitOrUnavailable(askGlobal, 'all');
    if (capError) return capError;
    runInBackground(locals, recordConversion(reactionRedis, 'chat_question'));

    return await runPostChat(
      { mode, note, question },
      { models: models(), onEvent },
      request.signal,
    );
  } catch (err) {
    captureException(new Error('Post chat request failed.'));
    console.error('[chat-post] unhandled:', (err as Error)?.name);
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
