/**
 * Rate Limiting Middleware
 * Implements basic rate limiting for API protection
 */

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  message?: string; // Error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

/**
 * In-memory store for rate limiting
 * For production, use Redis or similar persistent store
 */
class MemoryStore {
  private store: Map<string, {
    count: number;
    resetTime: number;
  }> = new Map();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string): Promise<number> {
    const current = this.store.get(key);
    if (current) {
      current.count++;
      return current.count;
    }
    return 1;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Singleton memory store instance
 */
export const memoryStore = new MemoryStore();

/**
 * Extract IP address from request with fallbacks
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP address
  const headers = request.headers;
  
  // Vercel/Cloudflare headers
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) return xRealIP;
  
  // Fallback to a default for development
  return 'unknown-ip';
}

/**
 * Default key generator based on IP address
 */
export function defaultKeyGenerator(request: Request): string {
  const ip = getClientIP(request);
  const url = new URL(request.url);
  return `${ip}:${url.pathname}`;
}

/**
 * Rate limiting implementation
 */
export async function rateLimit(
  request: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 100, // 100 requests per minute default
    keyGenerator = defaultKeyGenerator
  } = options;

  const key = keyGenerator(request);
  const now = Date.now();
  
  // Get current count for this key
  let record = await memoryStore.get(key);
  
  // If no record or window expired, create new
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    };
    await memoryStore.set(key, record);
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: record.resetTime,
      total: maxRequests
    };
  }
  
  // Increment count
  record.count++;
  await memoryStore.set(key, record);
  
  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);
  
  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
    total: maxRequests
  };
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // API endpoints (strict)
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 1 request per second average
    message: 'Too many API requests, please try again later'
  },
  
  // Authentication endpoints (very strict)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  },
  
  // Form submissions (moderate)
  form: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 submissions per minute
    message: 'Too many form submissions, please slow down'
  },
  
  // Static assets (lenient)
  static: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // Very high limit for static assets
    message: 'Rate limit exceeded for static resources'
  },
  
  // General pages (moderate)
  pages: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 page views per minute
    message: 'Too many requests, please slow down'
  }
} as const;

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.total.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  };
}

/**
 * Rate limit middleware factory
 */
export function createRateLimit(options: RateLimitOptions = {}) {
  return async (request: Request): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
    message?: string;
  }> => {
    const result = await rateLimit(request, options);
    const headers = getRateLimitHeaders(result);
    
    return {
      allowed: result.allowed,
      headers,
      message: result.allowed ? undefined : options.message
    };
  };
}

/**
 * Bot detection utilities
 */
export const botDetection = {
  // Common bot user agents
  botPatterns: [
    /bot/i,
    /spider/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /postman/i,
    /insomnia/i
  ],
  
  // Check if request is from a bot
  isBot: (request: Request): boolean => {
    const userAgent = request.headers.get('user-agent') || '';
    return botDetection.botPatterns.some(pattern => pattern.test(userAgent));
  },
  
  // More lenient rate limits for legitimate bots
  getBotRateLimit: (): RateLimitOptions => ({
    windowMs: 60 * 1000,
    maxRequests: 30, // Lower limit for bots
    message: 'Bot rate limit exceeded'
  })
};

/**
 * Development utilities
 */
export const devRateLimit = {
  // Clear all rate limit data
  clear: () => {
    memoryStore.cleanup();
  },
  
  // Get current rate limit status for a key
  status: async (key: string) => {
    return await memoryStore.get(key);
  },
  
  // Test rate limiting
  test: async (request: Request, options?: RateLimitOptions) => {
    return await rateLimit(request, options);
  }
};

/**
 * Production monitoring
 */
export const prodRateLimit = {
  // Monitor rate limit violations
  monitor: {
    violations: 0,
    lastViolation: null as Date | null,
    
    record: (ip: string, endpoint: string) => {
      prodRateLimit.monitor.violations++;
      prodRateLimit.monitor.lastViolation = new Date();
      console.warn(`Rate limit violation: ${ip} on ${endpoint}`);
    }
  },
  
  // Health check
  healthCheck: () => ({
    status: 'healthy',
    violations: prodRateLimit.monitor.violations,
    lastViolation: prodRateLimit.monitor.lastViolation
  })
};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  memoryStore.cleanup();
}, 5 * 60 * 1000);

/**
 * Export main rate limiting functionality
 */
export default {
  rateLimit,
  createRateLimit,
  presets: rateLimitPresets,
  getHeaders: getRateLimitHeaders,
  botDetection,
  dev: devRateLimit,
  prod: prodRateLimit
};