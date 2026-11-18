import type { APIRoute } from 'astro';
import { readLimitedText } from '@/utils/request-security';
import {
  isClientEvent,
  recordConversion,
  recordPostView,
  runInBackground,
} from '@/utils/conversions';
import { createRatelimit, getClientIp, limitOrUnavailable, reactionRedis } from '@/utils/redis';
import { isAllowedFormOrigin } from '@/utils/request-security';
import { isPublishedPostSlug } from '@/utils/published-posts';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:conversions', 20, '1 m');
const MAX_BODY_BYTES = 512;

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
  let post: unknown;
  try {
    const body = JSON.parse(text) as { event?: unknown; post?: unknown };
    event = body?.event;
    post = body?.post;
  } catch {
    return status(400);
  }
  const isPostView = event === 'post_view';
  if (!isPostView && !isClientEvent(event)) return status(422);
  if (isPostView && (typeof post !== 'string' || !isPublishedPostSlug(post))) return status(422);

  // Fail closed: without a limiter any client could inflate totals without bound.
  if (!ratelimit || !reactionRedis) return status(503);
  const ip = getClientIp(request, clientAddress);
  if (!ip) return status(400);
  const limitError = await limitOrUnavailable(ratelimit, ip);
  if (limitError) return limitError;

  if (isPostView) runInBackground(locals, recordPostView(reactionRedis, post as string));
  else if (isClientEvent(event)) runInBackground(locals, recordConversion(reactionRedis, event));
  return status(204);
};
