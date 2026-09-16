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

export const redis = (() => {
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
      retries: 1,
      backoff: (retryCount) => retryCount * 50,
    },
  });
})();

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
  });
}

/** Cloudflare's connecting IP is unspoofable; forwarded headers are not. */
export function getClientIp(request: Request, clientAddress?: string): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anonymous'
  );
}
