// Advanced rate limiting middleware with sliding windows and Redis

import { Redis } from '@upstash/redis';
import type { APIContext, MiddlewareHandler } from 'astro';
import { SECURITY_CONFIG } from '../utils/security-utils';

// Redis client (initialize only if credentials are available)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (context: APIContext) => string;
  onLimitReached?: (context: APIContext) => void;
}

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Advanced sliding window rate limiter
 */
class SlidingWindowRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW,
      maxRequests: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
      keyGenerator: (context) => this.getClientKey(context),
      ...config,
    };
  }

  private getClientKey(context: APIContext): string {
    const ip = this.getClientIP(context);
    const userAgent = context.request?.headers.get('user-agent') || 'unknown';

    // Create a composite key for better tracking
    const hash = this.simpleHash(`${ip}:${userAgent}`);
    return `rate_limit:${hash}`;
  }

  private getClientIP(context: APIContext): string {
    const request = context.request;
    return (
      request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request?.headers.get('x-real-ip') ||
      request?.headers.get('cf-connecting-ip') ||
      context.clientAddress ||
      'unknown'
    );
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).padStart(8, '0'); // Ensure consistent length
  }

  async checkLimit(context: APIContext): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(context);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!redis) {
      // Fallback to in-memory rate limiting
      return this.checkInMemoryLimit(key, now, windowStart);
    }

    try {
      // Use Redis for distributed rate limiting
      return await this.checkRedisLimit(key, now, windowStart);
    } catch (error) {
      console.warn('Redis rate limiting failed, falling back to in-memory:', error);
      return this.checkInMemoryLimit(key, now, windowStart);
    }
  }

  private async checkRedisLimit(
    key: string,
    now: number,
    windowStart: number
  ): Promise<RateLimitResult> {
    const pipeline = redis!.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiration
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = (results[1] as number) + 1; // +1 for the request we just added

    const allowed = currentCount <= this.config.maxRequests;
    const remainingRequests = Math.max(0, this.config.maxRequests - currentCount);
    const resetTime = now + this.config.windowMs;

    if (!allowed) {
      // Remove the request we just added since it's not allowed
      await redis!.zrem(key, `${now}-${Math.random()}`);

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        retryAfter: Math.ceil(this.config.windowMs / 1000),
      };
    }

    return {
      allowed: true,
      remainingRequests,
      resetTime,
    };
  }

  private inMemoryStore = new Map<string, number[]>();

  private checkInMemoryLimit(key: string, now: number, windowStart: number): RateLimitResult {
    const requests = this.inMemoryStore.get(key) || [];

    // Remove expired requests
    const validRequests = requests.filter((timestamp) => timestamp > windowStart);

    const allowed = validRequests.length < this.config.maxRequests;

    if (allowed) {
      validRequests.push(now);
      this.inMemoryStore.set(key, validRequests);
    }

    const remainingRequests = Math.max(0, this.config.maxRequests - validRequests.length);
    const resetTime = now + this.config.windowMs;

    return {
      allowed,
      remainingRequests,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil(this.config.windowMs / 1000),
    };
  }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(
  config: Partial<RateLimitConfig> = {}
): MiddlewareHandler {
  const limiter = new SlidingWindowRateLimiter(config as RateLimitConfig);

  return async (context, next) => {
    // Skip rate limiting for certain paths
    const skipPaths = ['/api/health', '/favicon.ico', '/robots.txt'];
    if (skipPaths.some((path) => context.url.pathname.startsWith(path))) {
      return next();
    }

    try {
      const result = await limiter.checkLimit(context);

      if (!result.allowed) {
        // Log rate limit violation
        console.warn('Rate limit exceeded:', {
          ip: context.request?.headers.get('x-forwarded-for') || 'unknown',
          path: context.url.pathname,
          userAgent: context.request?.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        });

        if (config.onLimitReached) {
          config.onLimitReached(context);
        }

        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': config.maxRequests?.toString() || '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        });
      }

      // Add rate limit headers to successful responses
      const response = await next();

      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests?.toString() || '100');
        response.headers.set('X-RateLimit-Remaining', result.remainingRequests.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      }

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed
      return next();
    }
  };
}

/**
 * Default rate limiting middleware
 */
export const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  onLimitReached: (context) => {
    // Could integrate with monitoring/alerting here
    console.warn(`Rate limit exceeded for ${context.url.pathname}`);
  },
});

/**
 * Strict rate limiting for sensitive endpoints
 */
export const strictRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window
  onLimitReached: (context) => {
    console.warn(`Strict rate limit exceeded for ${context.url.pathname}`);
  },
});
