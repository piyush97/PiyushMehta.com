import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';

export const prerender = false;

const VALID_REACTIONS = ['like', 'helpful', 'insightful', 'bookmark'] as const;

// Module-level singletons — initialised once per cold start, reused across requests.
const redis = (() => {
  const url = ENV.UPSTASH_REDIS_REST_URL;
  const token = ENV.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
})();

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'reactions:ratelimit',
    })
  : null;

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } as const;

export const GET: APIRoute = async ({ url }) => {
  const postId = url.searchParams.get('postId');
  if (!postId) {
    return new Response(JSON.stringify({ error: 'postId required' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (!redis) {
    const empty = Object.fromEntries(VALID_REACTIONS.map((r) => [r, 0]));
    return new Response(JSON.stringify(empty), { headers: JSON_HEADERS });
  }

  try {
    const counts = await redis.hgetall(`reactions:${postId}`);
    const result = Object.fromEntries(
      VALID_REACTIONS.map((r) => [r, counts ? Number(counts[r] ?? 0) : 0])
    );
    return new Response(JSON.stringify(result), { headers: JSON_HEADERS });
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

  // Prefer a real IP from edge/proxy headers; fall back to 'anonymous' as a
  // last resort so we never collapse all traffic into one rate-limit bucket.
  const ip =
    clientAddress ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous';

  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: JSON_HEADERS,
    });
  }

  let body: { postId: string; reaction: string; action: 'add' | 'remove' };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { postId, reaction, action } = body;
  if (
    !postId ||
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
