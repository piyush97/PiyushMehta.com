/**
 * Shared Upstash Redis client.
 *
 * One singleton per isolate: the REST client is stateless, so re-creating it
 * per request only wastes allocations. Returns null when credentials are absent
 * so callers can degrade instead of throwing at module load.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import { getRateLimitKey, json } from './request-security';
export { getClientIp } from './request-security';

function createRedisClient(retries: number) {
  const url = ENV.UPSTASH_REDIS_REST_URL;
  const token = ENV.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Redis({
    url,
    token,
    // Must be a factory: a bare AbortSignal is created once at module init and
    // aborts every later request on the same isolate.
    signal: () => AbortSignal.timeout(2500),
    retry: {
      retries,
      backoff: (retryCount) => retryCount * 50,
    },
  });
}

// Read/rate-limit operations may retry. Non-idempotent counter writes use the
// no-retry client below so an unknown network outcome is not duplicated.
export const redis = createRedisClient(1);
export const reactionRedis = createRedisClient(0);

export function createRatelimit(
  prefix: string,
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix,
    timeout: 0,
  });
}

/** Redis failures and SDK timeouts must never grant an allowance. */
export async function limitOrUnavailable(
  limiter: Pick<Ratelimit, 'limit'> | null,
  key: string,
): Promise<Response | null> {
  if (!limiter) return json({ error: 'Service unavailable.' }, 503, { 'Retry-After': '30' });
  try {
    const result = await limiter.limit(getRateLimitKey(key));
    if (result.reason === 'timeout')
      return json({ error: 'Service unavailable.' }, 503, { 'Retry-After': '30' });
    if (!result.success)
      return json({ error: 'Too many requests.' }, 429, {
        'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
      });
    return null;
  } catch {
    captureException(new Error('Rate limit backend unavailable.'));
    return json({ error: 'Service unavailable.' }, 503, { 'Retry-After': '30' });
  }
}
