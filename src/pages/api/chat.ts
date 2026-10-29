import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { ENV } from 'varlock/env';
import { isAllowedFormOrigin } from '@/utils/request-security';
import { recordConversion, runInBackground } from '@/utils/conversions';
import { createRatelimit, getClientIp, reactionRedis } from '@/utils/redis';
import { chatModels } from '@/utils/chat/models';
import { runChat } from '@/utils/chat/pipeline';
import { MAX_BODY_BYTES, parseChatRequest, readLimitedText } from '@/utils/chat/schema';
import { sanitizeUserText, MAX_MESSAGE_CHARS } from '@/utils/chat/sanitize';
import { verifySession } from '@/utils/chat/session';

export const prerender = false;

const perMinute = createRatelimit('ratelimit:chat:min', 8, '1 m');
const perDay = createRatelimit('ratelimit:chat:day', 60, '1 d');
const globalDay = createRatelimit('ratelimit:chat:global', 600, '1 d');

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  try {
    if (!isAllowedFormOrigin(request)) return json({ error: 'Forbidden.' }, 403);

    const text = await readLimitedText(request, MAX_BODY_BYTES);
    if (text === null) return json({ error: 'Request too large.' }, 413);

    // Fail closed: every protection below must be configured.
    const secret = ENV.CHAT_SESSION_SECRET;
    if (!secret || !perMinute || !perDay || !globalDay)
      return json({ error: 'Chat unavailable.' }, 503);

    const ip = getClientIp(request, clientAddress);
    const session = request.headers.get('x-chat-session') ?? '';
    if (!(await verifySession(secret, session, ip)))
      return json({ error: 'Session required.' }, 401);

    // Sequential so a rejected request never spends the daily or site-wide budget.
    if (!(await perMinute.limit(ip)).success || !(await perDay.limit(ip)).success)
      return json({ error: 'Too many requests. Please slow down.' }, 429);

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: 'Invalid request.' }, 400);
    }
    const parsed = parseChatRequest(body);
    if (!parsed.ok) return json({ error: 'Invalid request.' }, 422);

    const question = sanitizeUserText(parsed.question);
    if (question.length === 0 || question.length > MAX_MESSAGE_CHARS)
      return json({ error: `Questions must be 1-${MAX_MESSAGE_CHARS} characters.` }, 422);
    // Site-wide cap is counted last: only valid, rate-allowed questions spend it.
    if (!(await globalDay.limit('all')).success)
      return json({ error: 'Daily capacity reached. Please come back tomorrow.' }, 429);
    runInBackground(locals, recordConversion(reactionRedis, 'chat_question'));

    const models = chatModels({ ai: (cfEnv as { AI?: Ai }).AI, groqKey: ENV.GROQ_API_KEY });
    // Client-sent history is untrusted (assistant turns can be forged), so each question
    // is answered on its own.
    return await runChat(
      question,
      [],
      { models, onEvent: (e, detail) => console.info('[chat]', e, JSON.stringify(detail ?? {})) },
      request.signal,
    );
  } catch (err) {
    console.error('[chat] unhandled:', (err as Error)?.name);
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
