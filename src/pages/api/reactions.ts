import type { APIRoute } from 'astro';
import { isPublishedPostSlug } from '@/utils/published-posts';
import { toBlogPostSlug } from '@/utils/blog-recommendations';
import { createRatelimit, getClientIp, reactionRedis, redis } from '@/utils/redis';

export const prerender = false;

const VALID_REACTIONS = ['like', 'helpful', 'insightful', 'bookmark'] as const;
const MAX_BODY_BYTES = 8 * 1024;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } as const;

// Counts are a vanity metric: a few seconds of edge staleness is invisible to
// readers but collapses repeat reads onto one Redis round-trip per PoP.
const GET_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
} as const;

const ratelimit = createRatelimit('reactions:ratelimit', 30, '1 m');

function json(
  data: unknown,
  status = 200,
  headers: Readonly<Record<string, string>> = JSON_HEADERS,
) {
  return new Response(JSON.stringify(data), { status, headers });
}

function normalizePostId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = toBlogPostSlug(value.trim());
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/i.test(normalized)) return null;
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

export const GET: APIRoute = async ({ url }) => {
  const postId = normalizePostId(url.searchParams.get('postId'));
  if (!postId) {
    return json(
      { error: url.searchParams.has('postId') ? 'Invalid postId' : 'postId required' },
      400,
    );
  }

  const postError = validatePublishedPost(postId);
  if (postError) return postError;

  if (!redis) return json({ error: 'Reaction service unavailable' }, 503);

  try {
    const counts = await redis.hgetall<Record<string, string | number>>(`reactions:v1:${postId}`);
    const result = Object.fromEntries(
      VALID_REACTIONS.map((reaction) => [reaction, safeCount(counts?.[reaction])]),
    );
    return json(result, 200, GET_HEADERS);
  } catch {
    return json({ error: 'Reaction service unavailable' }, 503);
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Request body is too large' }, 413);
  }

  const bodyText = await request.text();
  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
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

  try {
    const { success } = await ratelimit.limit(getClientIp(request, clientAddress));
    if (!success) return json({ error: 'Too many requests' }, 429);
  } catch {
    return json({ error: 'Rate limit unavailable' }, 503);
  }

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
