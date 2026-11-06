import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { isAllowedFormOrigin, json, readLimitedText } from '@/utils/request-security';
import { createRatelimit, getClientIp, limitOrUnavailable } from '@/utils/redis';
import { signSession, verifyTurnstile } from '@/utils/chat/session';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:chat-session', 20, '1 h');

/** The public widget key remains runtime-bound; no secret or write is exposed by GET. */
export const GET: APIRoute = async () => {
  const siteKey = ENV.PUBLIC_TURNSTILE_SITE_KEY;
  return siteKey ? json({ siteKey }) : json({ error: 'Verification unavailable.' }, 503);
};

/** Exchanges a Turnstile token for a short-lived, IP-bound chat session token. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isAllowedFormOrigin(request)) return json({ error: 'Forbidden.' }, 403);
  const secret = ENV.CHAT_SESSION_SECRET;
  const turnstile = ENV.TURNSTILE_SECRET_KEY;
  if (!secret || !turnstile || !ratelimit) return json({ error: 'Chat unavailable.' }, 503);

  const ip = getClientIp(request, clientAddress);
  if (!ip) return json({ error: 'Client address required.' }, 400);
  const limitError = await limitOrUnavailable(ratelimit, ip);
  if (limitError) return limitError;

  let token: unknown;
  try {
    const text = await readLimitedText(request, 8 * 1024);
    if (text === null) return json({ error: 'Request too large.' }, 413);
    token = (JSON.parse(text) as { token?: unknown }).token;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096)
    return json({ error: 'Invalid request.' }, 400);
  if (!(await verifyTurnstile(turnstile, token, ip, new URL(request.url).hostname)))
    return json({ error: 'Verification failed.' }, 403);

  return json({ session: await signSession(secret, ip) });
};
