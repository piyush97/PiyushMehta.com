import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';

export const prerender = false;

const VALID_REACTIONS = ['like', 'helpful', 'insightful', 'bookmark'] as const;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } as const;

// Module-level singletons — initialised once per cold start, reused across requests.
const redis = (() => {
  const url = ENV.UPSTASH_REDIS_REST_URL;
  const token = ENV.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Redis({
    url,
    token,
    signal: () => AbortSignal.timeout(2500),
    retry: {
      retries: 1,
      backoff: (retryCount) => retryCount * 50,
    },
  });
})();

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'reactions:ratelimit',
    })
  : null;

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
    return new Response(JSON.stringify(empty), { headers: JSON_HEADERS });
  }

  try {
    const counts = await redis.hgetall<Record<string, string | number>>(`reactions:${postId}`);
    const result = Object.fromEntries(
      VALID_REACTIONS.map((reaction) => [reaction, safeCount(counts?.[reaction])]),
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

  // Cloudflare supplies the connecting address; use it before forwarded headers
  // so a client cannot bypass the limiter by spoofing x-forwarded-for.
  const ip =
    request.headers.get('cf-connecting-ip') ||
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous';

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
