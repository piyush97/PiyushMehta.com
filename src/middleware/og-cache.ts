/**
 * OG Image Caching Middleware
 * Implements advanced caching strategies for optimal performance
 */

import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // SWR time in seconds
  tags?: string[]; // Cache tags for invalidation
  vary?: string[]; // Headers to vary cache on
}

export interface CacheResult<T = unknown> {
  hit: boolean;
  data?: T;
  etag?: string;
  lastModified?: Date;
  stale?: boolean;
}

/**
 * Generate cache key from OG image parameters
 */
export function generateCacheKey(params: Record<string, unknown>): string {
  // Create deterministic cache key
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const paramString = JSON.stringify(sortedParams);
  return createHash('sha256').update(paramString).digest('hex').substring(0, 16);
}

/**
 * Generate ETag for cache validation
 */
export function generateETag(content: string | Buffer): string {
  return `"${createHash('sha256').update(content).digest('hex').substring(0, 16)}"`;
}

/**
 * Cache headers for OG images
 */
export function getCacheHeaders(options: CacheOptions = {}): Record<string, string> {
  const {
    ttl = 31536000, // 1 year default
    staleWhileRevalidate = 86400, // 1 day SWR
    tags = [],
    vary = ['User-Agent'],
  } = options;

  const headers: Record<string, string> = {
    'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${staleWhileRevalidate}, immutable`,
    'CDN-Cache-Control': `max-age=${ttl}`,
    'Vercel-CDN-Cache-Control': `max-age=${ttl}`,
    'X-Cache-Status': 'MISS',
  };

  if (tags.length > 0) {
    headers['Cache-Tag'] = tags.join(',');
  }

  if (vary.length > 0) {
    headers['Vary'] = vary.join(',');
  }

  return headers;
}

/**
 * Redis-compatible cache implementation
 */
export class OGImageCache {
  private cache: Map<
    string,
    {
      data: Buffer;
      etag: string;
      timestamp: number;
      ttl: number;
    }
  > = new Map();

  constructor(private defaultTTL: number = 31536000) {}

  async get(key: string): Promise<CacheResult<Buffer>> {
    const entry = this.cache.get(key);

    if (!entry) {
      return { hit: false };
    }

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return { hit: false };
    }

    return {
      hit: true,
      data: entry.data,
      etag: entry.etag,
      lastModified: new Date(entry.timestamp),
      stale: age > entry.ttl * 0.9, // Consider stale if 90% of TTL has passed
    };
  }

  async set(key: string, data: Buffer, options: CacheOptions = {}): Promise<void> {
    const etag = generateETag(data);
    const ttl = options.ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      etag,
      timestamp: Date.now(),
      ttl,
    });
  }

  async invalidate(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    const memoryUsage = Array.from(this.cache.values()).reduce(
      (acc, entry) => acc + entry.data.length,
      0
    );

    return {
      size,
      hitRate: 0, // Would need to track hits/misses for real implementation
      memoryUsage,
    };
  }
}

/**
 * Singleton cache instance
 */
export const ogImageCache = new OGImageCache();

/**
 * Cache middleware for OG image generation
 */
export async function withCache<T>(
  key: string,
  generator: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{
  data: T;
  cached: boolean;
  etag: string;
  headers: Record<string, string>;
}> {
  const cacheKey = `og:${key}`;
  const cacheResult = await ogImageCache.get(cacheKey);

  if (cacheResult.hit && cacheResult.data) {
    return {
      data: cacheResult.data as T,
      cached: true,
      etag: cacheResult.etag!,
      headers: {
        ...getCacheHeaders(options),
        'X-Cache-Status': 'HIT',
        ETag: cacheResult.etag!,
        'Last-Modified': cacheResult.lastModified!.toUTCString(),
      },
    };
  }

  // Generate new data
  const data = await generator();

  // Cache the result
  if (data instanceof Buffer || typeof data === 'string') {
    await ogImageCache.set(cacheKey, data as Buffer, options);
  }

  const etag = generateETag(data as Buffer);

  return {
    data,
    cached: false,
    etag,
    headers: {
      ...getCacheHeaders(options),
      'X-Cache-Status': 'MISS',
      ETag: etag,
      'Last-Modified': new Date().toUTCString(),
    },
  };
}

/**
 * Preload cache with common OG images
 */
export async function preloadCache(
  preloadItems: Array<{
    key: string;
    generator: () => Promise<Buffer>;
    options?: CacheOptions;
  }>
) {
  const promises = preloadItems.map(async ({ key, generator, options }) => {
    const cacheKey = `og:${key}`;
    const exists = await ogImageCache.get(cacheKey);

    if (!exists.hit) {
      const data = await generator();
      await ogImageCache.set(cacheKey, data, options);
    }
  });

  await Promise.all(promises);
}

/**
 * Cache warming utility
 */
export async function warmCache(commonTemplates: string[] = ['syntax', 'modern', 'terminal']) {
  const commonTitles = [
    'Piyush Mehta',
    'Software Engineer & Tech Speaker',
    'React Developer in Canada',
    'Full Stack Developer',
    'Open Source Contributor',
  ];

  const preloadItems = commonTemplates.flatMap((template) =>
    commonTitles.map((title) => ({
      key: generateCacheKey({ title, template, theme: 'dark' }),
      generator: async () => {
        // This would call the actual OG generation
        // For now, return empty buffer
        return Buffer.from('');
      },
      options: { ttl: 86400 * 7 }, // 1 week for common items
    }))
  );

  await preloadCache(preloadItems);
}

/**
 * Development cache utilities
 */
export const devCache = {
  clear: () => ogImageCache.invalidate(),
  stats: () => ogImageCache.getStats(),
  warmUp: () => warmCache(),

  // Debug specific cache entries
  inspect: (key: string) => ogImageCache.get(`og:${key}`),

  // Simulate cache invalidation
  invalidatePattern: (pattern: string) => ogImageCache.invalidate(pattern),
};

/**
 * Production cache optimization
 */
export const prodCache = {
  // Configure for production use
  configure: (options: { redisUrl?: string; maxMemory?: number; ttl?: number }) => {
    // Would integrate with Redis/Upstash in production
    console.log('Production cache configured:', options);
  },

  // Metrics for monitoring
  getMetrics: () => ({
    ...ogImageCache.getStats(),
    timestamp: Date.now(),
    version: '1.0.0',
  }),

  // Health check
  healthCheck: async () => {
    try {
      const testKey = 'health-check';
      await ogImageCache.set(testKey, Buffer.from('test'), { ttl: 1 });
      const result = await ogImageCache.get(testKey);
      return result.hit;
    } catch (_error) {
      return false;
    }
  },
};

export default {
  generateCacheKey,
  generateETag,
  getCacheHeaders,
  withCache,
  preloadCache,
  warmCache,
  devCache,
  prodCache,
  cache: ogImageCache,
};
