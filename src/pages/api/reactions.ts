import type { APIRoute } from 'astro';
import { createRatelimit, getClientIp, redis } from '@/utils/redis';

export const prerender = false;

const VALID_REACTIONS = ['like', 'helpful', 'insightful', 'bookmark'] as const;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } as const;

// Counts are a vanity metric: a few seconds of edge staleness is invisible to
// readers but collapses repeat reads onto one Redis round-trip per PoP.
const GET_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
} as const;

const ratelimit = createRatelimit('reactions:ratelimit', 30, '1 m');

function isValidPostId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200;
}

function safeCount(value: unknown): number {
  const count = Number(value ?? 0);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

export const GET: APIRoute = async ({ url }) => {
  const postId = url.searchParams.get('postId');
  if (!isValidPostId(postId)) {
    return new Response(JSON.stringify({ error: postId ? 'Invalid postId' : 'postId required' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (!redis) {
    const empty = Object.fromEntries(VALID_REACTIONS.map((reaction) => [reaction, 0]));
    return new Response(JSON.stringify(empty), { headers: GET_HEADERS });
  }

  try {
    const counts = await redis.hgetall<Record<string, string | number>>(`reactions:${postId}`);
    const result = Object.fromEntries(
      VALID_REACTIONS.map((reaction) => [reaction, safeCount(counts?.[reaction])]),
    );
    return new Response(JSON.stringify(result), { headers: GET_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!redis || !ratelimit) {
    return new Response(JSON.stringify({ error: 'Redis not configured' }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  }

  const ip = getClientIp(request, clientAddress);

  try {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: JSON_HEADERS,
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Rate limit unavailable' }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (!body || typeof body !== 'object') {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { postId, reaction, action } = body as {
    postId?: unknown;
    reaction?: unknown;
    action?: unknown;
  };

  if (
    !isValidPostId(postId) ||
    typeof reaction !== 'string' ||
    !VALID_REACTIONS.includes(reaction as (typeof VALID_REACTIONS)[number]) ||
    (action !== 'add' && action !== 'remove')
  ) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  try {
    const key = `reactions:${postId}`;
    let newCount: number;

    if (action === 'add') {
      newCount = await redis.hincrby(key, reaction, 1);
    } else {
      // Use atomic hincrby(-1) to avoid the read-modify-write race of hget+hset.
      // If the result goes negative (e.g. duplicate removes), clamp back to 0.
      newCount = await redis.hincrby(key, reaction, -1);
      if (newCount < 0) {
        await redis.hset(key, { [reaction]: 0 });
        newCount = 0;
      }
    }

    return new Response(JSON.stringify({ count: newCount }), { headers: JSON_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};
