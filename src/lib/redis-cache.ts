// Redis caching layer for database performance optimization
import { Redis } from '@upstash/redis';
import type { APIContext } from 'astro';

// Redis configuration
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
  enableCompression: boolean;
  maxSize: number; // Maximum cache size in bytes
}

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  lastReset: number;
}

export class RedisCache {
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private compressionThreshold = 1024; // Compress values larger than 1KB

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 300, // 5 minutes default
      prefix: 'piyush_cache',
      enableCompression: true,
      maxSize: 10 * 1024 * 1024, // 10MB default
      ...config,
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * Get value from cache with automatic decompression
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache get');
      return null;
    }

    try {
      this.metrics.totalRequests++;
      const cacheKey = this.buildKey(key);
      const cached = await redis.get(cacheKey);

      if (cached === null) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;

      // Handle compressed data
      if (this.isCompressed(cached)) {
        return this.decompress(cached);
      }

      return cached as T;
    } catch (error) {
      console.warn('Redis cache get failed:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set value in cache with automatic compression
   */
  async set<T = unknown>(key: string, value: T, customTtl?: number): Promise<boolean> {
    if (!redis) {
      console.warn('Redis not configured, skipping cache set');
      return false;
    }

    try {
      const cacheKey = this.buildKey(key);
      const ttl = customTtl || this.config.ttl;

      let finalValue: T | { _compressed: true; data: string } = value;

      // Compress large values if enabled
      if (this.config.enableCompression) {
        const serialized = JSON.stringify(value);
        if (serialized.length > this.compressionThreshold) {
          finalValue = this.compress(value);
        }
      }

      await redis.setex(cacheKey, ttl, JSON.stringify(finalValue));
      return true;
    } catch (error) {
      console.warn('Redis cache set failed:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      const cacheKey = this.buildKey(key);
      await redis.del(cacheKey);
      return true;
    } catch (error) {
      console.warn('Redis cache delete failed:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or compute and cache
   */
  async getOrSet<T>(key: string, computeFn: () => Promise<T> | T, customTtl?: number): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const computed = await computeFn();

    // Cache the computed value
    await this.set(key, computed, customTtl);

    return computed;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!redis) return 0;

    try {
      const searchPattern = this.buildKey(pattern);
      const keys = await redis.keys(searchPattern);

      if (keys.length === 0) return 0;

      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.warn('Redis cache invalidation failed:', error);
      return 0;
    }
  }

  /**
   * Get cache metrics and hit rate
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const hitRate =
      this.metrics.totalRequests > 0 ? (this.metrics.hits / this.metrics.totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(
    warmingData: Array<{ key: string; value: unknown; ttl?: number }>
  ): Promise<void> {
    if (!redis) return;

    try {
      const pipeline = redis.pipeline();

      for (const item of warmingData) {
        const cacheKey = this.buildKey(item.key);
        const ttl = item.ttl || this.config.ttl;
        pipeline.setex(cacheKey, ttl, JSON.stringify(item.value));
      }

      await pipeline.exec();
      console.log(`Cache warmed with ${warmingData.length} items`);
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }

  /**
   * Get cache size and memory usage
   */
  async getCacheInfo(): Promise<{
    keyCount: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    if (!redis) {
      return { keyCount: 0, memoryUsage: '0B', hitRate: 0 };
    }

    try {
      const keys = await redis.keys(this.buildKey('*'));
      const info = await redis.info('memory');
      const metrics = this.getMetrics();

      // Extract memory usage from Redis info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

      return {
        keyCount: keys.length,
        memoryUsage,
        hitRate: metrics.hitRate,
      };
    } catch (error) {
      console.warn('Failed to get cache info:', error);
      return { keyCount: 0, memoryUsage: '0B', hitRate: 0 };
    }
  }

  private buildKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private compress(data: unknown): { _compressed: true; data: string } {
    // Simple base64 compression (in production, use gzip)
    const jsonString = JSON.stringify(data);
    const compressed = Buffer.from(jsonString).toString('base64');
    return { _compressed: true, data: compressed };
  }

  private decompress(compressed: unknown): unknown {
    if (!this.isCompressed(compressed)) return compressed;

    try {
      const compressedData = compressed as { _compressed: true; data: string };
      const jsonString = Buffer.from(compressedData.data, 'base64').toString();
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return compressed;
    }
  }

  private isCompressed(value: unknown): value is { _compressed: true; data: string } {
    return (
      value !== null &&
      typeof value === 'object' &&
      '_compressed' in value &&
      (value as { _compressed: boolean })._compressed === true
    );
  }
}

// Specialized cache instances for different data types
export const queryCache = new RedisCache({
  ttl: 300, // 5 minutes for database queries
  prefix: 'db_query',
  enableCompression: true,
});

export const userCache = new RedisCache({
  ttl: 900, // 15 minutes for user data
  prefix: 'user_data',
  enableCompression: false,
});

export const contentCache = new RedisCache({
  ttl: 1800, // 30 minutes for content
  prefix: 'content',
  enableCompression: true,
});

export const sessionCache = new RedisCache({
  ttl: 3600, // 1 hour for sessions
  prefix: 'session',
  enableCompression: false,
});

// Cache utilities for common patterns
export class CacheUtils {
  /**
   * Cache database query results
   */
  static async cacheQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    return queryCache.getOrSet(queryKey, queryFn, ttl);
  }

  /**
   * Cache user-specific data
   */
  static async cacheUserData<T>(
    userId: string,
    dataKey: string,
    dataFn: () => Promise<T>,
    ttl: number = 900
  ): Promise<T> {
    const cacheKey = `user:${userId}:${dataKey}`;
    return userCache.getOrSet(cacheKey, dataFn, ttl);
  }

  /**
   * Cache API responses
   */
  static async cacheApiResponse<T>(
    endpoint: string,
    params: Record<string, unknown>,
    responseFn: () => Promise<T>,
    ttl: number = 600
  ): Promise<T> {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const cacheKey = `api:${endpoint}:${Buffer.from(paramString).toString('base64')}`;
    return contentCache.getOrSet(cacheKey, responseFn, ttl);
  }

  /**
   * Cache blog post data
   */
  static async cacheBlogPost<T>(
    slug: string,
    postFn: () => Promise<T>,
    ttl: number = 1800
  ): Promise<T> {
    const cacheKey = `blog_post:${slug}`;
    return contentCache.getOrSet(cacheKey, postFn, ttl);
  }

  /**
   * Invalidate user-related caches
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await userCache.invalidatePattern(`user:${userId}:*`);
    await sessionCache.invalidatePattern(`user:${userId}:*`);
  }

  /**
   * Invalidate content caches
   */
  static async invalidateContentCache(type?: string): Promise<void> {
    const pattern = type ? `${type}:*` : '*';
    await contentCache.invalidatePattern(pattern);
  }
}

// Middleware for automatic cache invalidation
export function createCacheInvalidationMiddleware() {
  return async (context: APIContext, next: () => Promise<Response>) => {
    const response = await next();

    // Invalidate caches on successful mutations
    if (response.ok && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(context.request.method)) {
      const path = context.url.pathname;

      // Invalidate related caches based on the endpoint
      if (path.includes('/api/blog')) {
        await CacheUtils.invalidateContentCache('blog');
      } else if (path.includes('/api/user')) {
        const userId = context.params?.userId || context.url.searchParams.get('userId');
        if (userId) {
          await CacheUtils.invalidateUserCache(userId);
        }
      } else if (path.includes('/api/newsletter')) {
        await contentCache.invalidatePattern('newsletter:*');
      }
    }

    return response;
  };
}

// Export the main cache instance
export { redis };
export default RedisCache;
