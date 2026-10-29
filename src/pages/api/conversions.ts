import type { APIRoute } from 'astro';
import { readLimitedText } from '@/utils/chat/schema';
import { isClientEvent, recordConversion, runInBackground } from '@/utils/conversions';
import { createRatelimit, getClientIp, reactionRedis } from '@/utils/redis';
import { isAllowedFormOrigin } from '@/utils/request-security';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:conversions', 20, '1 m');
const MAX_BODY_BYTES = 256;

const status = (code: number) =>
  new Response(null, { status: code, headers: { 'Cache-Control': 'no-store' } });

/** Browser-reported events only (sendBeacon). Server-counted events are rejected. */
export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  if (!isAllowedFormOrigin(request)) return status(403);

  const text = await readLimitedText(request, MAX_BODY_BYTES);
  if (text === null) return status(413);

  let event: unknown;
  try {
    event = (JSON.parse(text) as { event?: unknown })?.event;
  } catch {
    return status(400);
  }
  if (!isClientEvent(event)) return status(422);

  // Fail closed: without a limiter any client could inflate totals without bound.
  if (!ratelimit || !reactionRedis) return status(503);
  if (!(await ratelimit.limit(getClientIp(request, clientAddress))).success) return status(429);

  runInBackground(locals, recordConversion(reactionRedis, event));
  return status(204);
};
