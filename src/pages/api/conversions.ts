import type { APIRoute } from 'astro';
import { readLimitedText } from '@/utils/request-security';
import { isClientEvent, recordConversion, runInBackground } from '@/utils/conversions';
import { createRatelimit, getClientIp, limitOrUnavailable, reactionRedis } from '@/utils/redis';
import { isAllowedFormOrigin } from '@/utils/request-security';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:conversions', 20, '1 m');
const MAX_BODY_BYTES = 256;

const status = (code: number) =>
  new Response(null, { status: code, headers: { 'Cache-Control': 'no-store' } });

/** Browser-reported events only (sendBeacon). Server-counted events are rejected. */
export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  if (!isAllowedFormOrigin(request)) return status(403);

  let text: string | null;
  try {
    text = await readLimitedText(request, MAX_BODY_BYTES);
  } catch {
    return status(400);
  }
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
  const ip = getClientIp(request, clientAddress);
  if (!ip) return status(400);
  const limitError = await limitOrUnavailable(ratelimit, ip);
  if (limitError) return limitError;

  runInBackground(locals, recordConversion(reactionRedis, event));
  return status(204);
};
