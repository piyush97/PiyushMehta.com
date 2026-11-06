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

  try {
    const key = `reactions:v1:${postId}`;
    let newCount: number;

    if (action === 'add') {
      newCount = await reactionRedis.hincrby(key, reaction, 1);
    } else {
      // Use atomic hincrby(-1) to avoid the read-modify-write race of hget+hset.
      // If the result goes negative (e.g. duplicate removes), clamp back to 0.
      newCount = await reactionRedis.hincrby(key, reaction, -1);
      if (newCount < 0) {
        await reactionRedis.hset(key, { [reaction]: 0 });
        newCount = 0;
      }
    }

    return json({ count: newCount });
  } catch {
    return json({ error: 'Reaction service unavailable' }, 503);
  }
};
