import type { APIRoute } from 'astro';
import { isAllowedFormOrigin, json, readLimitedText } from '@/utils/request-security';
import { runInBackground } from '@/utils/conversions';
import { isPublishedPostSlug, toPublishedPostSlug } from '@/utils/published-posts';
import { toBlogPostSlug } from '@/utils/blog-recommendations';
import {
  createRatelimit,
  getClientIp,
  limitOrUnavailable,
  reactionRedis,
  redis,
} from '@/utils/redis';

export const prerender = false;

const VALID_REACTIONS = ['like', 'helpful', 'insightful', 'bookmark'] as const;
const MAX_BODY_BYTES = 8 * 1024;
const VISITOR_COOKIE = 'pm_vid';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 30;
const VOTER_TTL_SECONDS = 60 * 60 * 24 * 90;

function readVisitorId(request: Request): string | null {
  const match = request.headers
    .get('cookie')
    ?.match(
      /(?:^|;\s*)pm_vid=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:;|$)/i,
    );
  return match ? match[1] : null;
}

async function visitorHash(visitorId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(visitorId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function withVisitorCookie(response: Response, visitorId: string, setCookie: boolean): Response {
  if (!setCookie) return response;
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=${VISITOR_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Counts are a vanity metric: a few seconds of edge staleness is invisible to
// readers but collapses repeat reads onto one Redis round-trip per PoP.
const GET_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=15',
} as const;

const ratelimit = createRatelimit('reactions:ratelimit', 30, '1 m');

function normalizePostId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = toPublishedPostSlug(toBlogPostSlug(value.trim()));
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(normalized)) return null;
  return normalized;
}

function safeCount(value: unknown): number {
  const count = Number(value ?? 0);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function validatePublishedPost(postId: string): Response | null {
  if (isPublishedPostSlug(postId)) return null;
  return json({ error: 'Post not found' }, 404);
}

export const GET: APIRoute = async ({ url, locals }) => {
  const postId = normalizePostId(url.searchParams.get('postId'));
  if (!postId) {
    return json(
      { error: url.searchParams.has('postId') ? 'Invalid postId' : 'postId required' },
      400,
    );
  }

  const postError = validatePublishedPost(postId);
  if (postError) return postError;

  const cache =
    typeof caches === 'undefined'
      ? undefined
      : (caches as CacheStorage & { default: Cache }).default;
  const cacheUrl = new URL('/api/reactions', url);
  cacheUrl.searchParams.set('postId', postId);
  const cacheKey = new Request(cacheUrl);
  try {
    const hit = await cache?.match(cacheKey);
    if (hit) return hit;
  } catch {
    /* Cache failures must not hide available counts. */
  }
  if (!redis) return json({ error: 'Reaction service unavailable' }, 503);

  try {
    const counts = await redis.hgetall<Record<string, string | number>>(`reactions:v1:${postId}`);
    const result = Object.fromEntries(
      VALID_REACTIONS.map((reaction) => [reaction, safeCount(counts?.[reaction])]),
    );
    const response = json(result, 200, GET_HEADERS);
    if (cache)
      runInBackground(
        locals,
        cache.put(cacheKey, response.clone()).catch(() => {}),
      );
    return response;
  } catch {
    return json({ error: 'Reaction service unavailable' }, 503);
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isAllowedFormOrigin(request)) return json({ error: 'Forbidden' }, 403);
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  ) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  let bodyText: string | null;
  try {
    bodyText = await readLimitedText(request, MAX_BODY_BYTES);
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
  if (bodyText === null) {
    return json({ error: 'Request body is too large' }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body || typeof body !== 'object') return json({ error: 'Invalid request' }, 400);

  const {
    postId: rawPostId,
    reaction,
    action,
  } = body as {
    postId?: unknown;
    reaction?: unknown;
    action?: unknown;
  };
  const postId = normalizePostId(rawPostId);

  if (
    !postId ||
    typeof reaction !== 'string' ||
    !VALID_REACTIONS.includes(reaction as (typeof VALID_REACTIONS)[number]) ||
    (action !== 'add' && action !== 'remove')
  ) {
    return json({ error: 'Invalid request' }, 400);
  }

  const postError = validatePublishedPost(postId);
  if (postError) return postError;

  if (!reactionRedis || !ratelimit) return json({ error: 'Reaction service unavailable' }, 503);

  const ip = getClientIp(request, clientAddress);
  if (!ip) return json({ error: 'Client address required.' }, 400);
  const limitError = await limitOrUnavailable(ratelimit, ip);
  if (limitError) return limitError;

  const existingVisitor = readVisitorId(request);
  const visitorId = existingVisitor ?? crypto.randomUUID();
  const setCookie = existingVisitor === null;
  const voter = await visitorHash(visitorId);

  try {
    const key = `reactions:v1:${postId}`;
    const voterKey = `reactions:v1:${postId}:${reaction}:voters`;
    // Only the request that actually changes set membership may move the count.
    const changed =
      action === 'add'
        ? await reactionRedis.sadd(voterKey, voter)
        : await reactionRedis.srem(voterKey, voter);
    // Voter sets are per post and reaction; expire them so they cannot grow forever.
    if (changed === 1) await reactionRedis.expire(voterKey, VOTER_TTL_SECONDS);
    let newCount: number;

    if (changed === 0) {
      newCount = safeCount(await reactionRedis.hget(key, reaction));
    } else {
      newCount = await reactionRedis.hincrby(key, reaction, action === 'add' ? 1 : -1);
      // Clamp when a stale voter set lets the counter drop below zero.
      if (newCount < 0) {
        await reactionRedis.hset(key, { [reaction]: 0 });
        newCount = 0;
      }
    }

    return withVisitorCookie(json({ count: newCount }), visitorId, setCookie);
  } catch {
    return withVisitorCookie(
      json({ error: 'Reaction service unavailable' }, 503),
      visitorId,
      setCookie,
    );
  }
};
