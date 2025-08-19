// Rate limiting middleware using Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { APIContext } from 'astro';
import { getClientIP } from './auth';

// Initialize Redis client
let redis: Redis | null = null;
const ratelimiters: Map<string, Ratelimit> = new Map();

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Missing Upstash Redis configuration');
    }

    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * Get or create rate limiter for specific action
 */
function getRateLimiter(action: string, limit: number, window: string): Ratelimit {
  const key = `${action}:${limit}:${window}`;

  if (!ratelimiters.has(key)) {
    const limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
      prefix: `ratelimit:${action}`,
    });
    ratelimiters.set(key, limiter);
  }

  return ratelimiters.get(key)!;
}

/**
 * Rate limiting configurations
 */
export const RateLimitConfig = {
  COMMENT_SUBMISSION: {
    limit: parseInt(process.env.MAX_COMMENTS_PER_HOUR || '10'),
    window: '1 h' as const,
    action: 'comment_submission',
  },
  LOGIN_ATTEMPTS: {
    limit: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5'),
    window: '15 m' as const,
    action: 'login_attempts',
  },
  API_REQUESTS: {
    limit: 100,
    window: '1 m' as const,
    action: 'api_requests',
  },
  LIKE_ACTIONS: {
    limit: 50,
    window: '1 m' as const,
    action: 'like_actions',
  },
} as const;

/**
 * Apply rate limiting to request
 */
export async function applyRateLimit(
  context: APIContext,
  config: (typeof RateLimitConfig)[keyof typeof RateLimitConfig],
  identifier?: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  // Skip rate limiting in development or if disabled
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_RATE_LIMITING !== 'true') {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: new Date(Date.now() + 60000),
    };
  }

  const ip = getClientIP(context.request);
  const rateLimitIdentifier = identifier || ip;

  try {
    const limiter = getRateLimiter(config.action, config.limit, config.window);
    const result = await limiter.limit(rateLimitIdentifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request if rate limiting fails
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: new Date(Date.now() + 60000),
    };
  }
}

/**
 * Rate limit middleware that throws on limit exceeded
 */
export async function rateLimitGuard(
  context: APIContext,
  config: (typeof RateLimitConfig)[keyof typeof RateLimitConfig],
  identifier?: string
): Promise<void> {
  const result = await applyRateLimit(context, config, identifier);

  if (!result.success) {
    throw new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${result.limit} per ${config.window}`,
        retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toISOString(),
          'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: { limit: number; remaining: number; reset: Date }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware for comment rate limiting
 */
export async function commentRateLimit(context: APIContext): Promise<void> {
  await rateLimitGuard(context, RateLimitConfig.COMMENT_SUBMISSION);
}

/**
 * Middleware for login rate limiting
 */
export async function loginRateLimit(context: APIContext, email?: string): Promise<void> {
  const ip = getClientIP(context.request);
  const identifier = email ? `${ip}:${email}` : ip;
  await rateLimitGuard(context, RateLimitConfig.LOGIN_ATTEMPTS, identifier);
}

/**
 * Middleware for API rate limiting
 */
export async function apiRateLimit(context: APIContext): Promise<void> {
  await rateLimitGuard(context, RateLimitConfig.API_REQUESTS);
}

/**
 * Middleware for like action rate limiting
 */
export async function likeRateLimit(context: APIContext): Promise<void> {
  await rateLimitGuard(context, RateLimitConfig.LIKE_ACTIONS);
}
