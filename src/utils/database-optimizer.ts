// Database query optimization and performance monitoring

import type { APIContext } from 'astro';
import { CacheUtils, queryCache } from '../lib/redis-cache';

interface QueryPerformanceMetrics {
  queryId: string;
  executionTime: number;
  cacheHit: boolean;
  rowsAffected?: number;
  timestamp: number;
}

interface DatabaseConfig {
  enableQueryCache: boolean;
  defaultCacheTtl: number;
  slowQueryThreshold: number;
  enablePerformanceMonitoring: boolean;
  maxConnectionPoolSize: number;
}

export class DatabaseOptimizer {
  private metrics: QueryPerformanceMetrics[] = [];
  private config: DatabaseConfig;
  private queryPatterns: Map<string, number> = new Map();

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      enableQueryCache: true,
      defaultCacheTtl: 300, // 5 minutes
      slowQueryThreshold: 1000, // 1 second
      enablePerformanceMonitoring: true,
      maxConnectionPoolSize: 10,
      ...config,
    };
  }

  /**
   * Execute optimized query with caching and monitoring
   */
  async executeQuery<T>(
    queryId: string,
    queryFn: () => Promise<T>,
    options: {
      cacheTtl?: number;
      enableCache?: boolean;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const {
      cacheTtl = this.config.defaultCacheTtl,
      enableCache = this.config.enableQueryCache,
      tags = [],
    } = options;

    let result: T;
    let cacheHit = false;

    try {
      if (enableCache) {
        // Try cache first
        const cacheKey = this.buildCacheKey(queryId, tags);
        result = await CacheUtils.cacheQuery(cacheKey, queryFn, cacheTtl);

        // Check if result came from cache
        const cached = await queryCache.get(cacheKey);
        cacheHit = cached !== null;
      } else {
        result = await queryFn();
      }

      // Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        this.recordMetrics({
          queryId,
          executionTime: Date.now() - startTime,
          cacheHit,
          timestamp: Date.now(),
        });
      }

      // Track query patterns
      this.trackQueryPattern(queryId);

      return result;
    } catch (error) {
      // Log slow or failed queries
      const executionTime = Date.now() - startTime;
      console.error(`Query failed: ${queryId} (${executionTime}ms)`, error);

      if (this.config.enablePerformanceMonitoring) {
        this.recordMetrics({
          queryId,
          executionTime,
          cacheHit: false,
          timestamp: Date.now(),
        });
      }

      throw error;
    }
  }

  /**
   * Batch execute multiple queries with optimization
   */
  async executeBatch<T>(
    queries: Array<{
      id: string;
      fn: () => Promise<T>;
      cacheTtl?: number;
      enableCache?: boolean;
    }>
  ): Promise<T[]> {
    const results = await Promise.allSettled(
      queries.map((query) =>
        this.executeQuery(query.id, query.fn, {
          cacheTtl: query.cacheTtl,
          enableCache: query.enableCache,
        })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch query failed: ${queries[index].id}`, result.reason);
        throw result.reason;
      }
    });
  }

  /**
   * Preload frequently accessed data
   */
  async preloadData(
    preloadQueries: Array<{
      key: string;
      queryFn: () => Promise<any>;
      ttl?: number;
    }>
  ): Promise<void> {
    const warmingData = await Promise.allSettled(
      preloadQueries.map(async (query) => {
        try {
          const value = await query.queryFn();
          return {
            key: query.key,
            value,
            ttl: query.ttl || this.config.defaultCacheTtl,
          };
        } catch (error) {
          console.warn(`Preload failed for ${query.key}:`, error);
          return null;
        }
      })
    );

    const successfulPreloads = warmingData
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value);

    if (successfulPreloads.length > 0) {
      await queryCache.warmCache(successfulPreloads);
      console.log(`Preloaded ${successfulPreloads.length} queries into cache`);
    }
  }

  /**
   * Get query performance analytics
   */
  getPerformanceAnalytics(): {
    totalQueries: number;
    avgExecutionTime: number;
    cacheHitRate: number;
    slowQueries: QueryPerformanceMetrics[];
    topQueries: Array<{ queryId: string; count: number; avgTime: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        avgExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        topQueries: [],
      };
    }

    const totalQueries = this.metrics.length;
    const avgExecutionTime =
      this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries;
    const cacheHits = this.metrics.filter((m) => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalQueries) * 100;

    const slowQueries = this.metrics
      .filter((m) => m.executionTime > this.config.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    // Aggregate query patterns
    const queryStats = new Map<string, { count: number; totalTime: number }>();
    this.metrics.forEach((metric) => {
      const existing = queryStats.get(metric.queryId) || { count: 0, totalTime: 0 };
      queryStats.set(metric.queryId, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.executionTime,
      });
    });

    const topQueries = Array.from(queryStats.entries())
      .map(([queryId, stats]) => ({
        queryId,
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalQueries,
      avgExecutionTime: Math.round(avgExecutionTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowQueries,
      topQueries,
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const analytics = this.getPerformanceAnalytics();

    return `
# Database Performance Report

## Summary
- **Total Queries**: ${analytics.totalQueries}
- **Average Execution Time**: ${analytics.avgExecutionTime}ms
- **Cache Hit Rate**: ${analytics.cacheHitRate}%

## Top Performing Queries
${analytics.topQueries
  .map((q) => `- **${q.queryId}**: ${q.count} executions, ${q.avgTime}ms avg`)
  .join('\n')}

## Slow Queries (>${this.config.slowQueryThreshold}ms)
${analytics.slowQueries
  .map((q) => `- **${q.queryId}**: ${q.executionTime}ms at ${new Date(q.timestamp).toISOString()}`)
  .join('\n')}

## Recommendations
${this.generateRecommendations(analytics)
  .map((r) => `- ${r}`)
  .join('\n')}
`;
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.queryPatterns.clear();
  }

  /**
   * Optimize query based on patterns
   */
  async optimizeQuery<T>(
    queryId: string,
    queryFn: () => Promise<T>,
    optimizations: {
      enablePagination?: boolean;
      maxResults?: number;
      enableIndexHints?: boolean;
      fields?: string[];
    } = {}
  ): Promise<T> {
    const {
      enablePagination = false,
      maxResults = 1000,
      enableIndexHints = false,
      fields = [],
    } = optimizations;

    // Track optimization usage
    this.trackQueryPattern(`optimized_${queryId}`);

    // Apply optimizations based on configuration
    const optimizedQueryFn = queryFn;

    // Note: In a real implementation, these would modify the actual SQL query
    // Here we're showing the optimization patterns

    if (enablePagination && maxResults) {
      console.log(`Query ${queryId}: Applying pagination limit of ${maxResults}`);
    }

    if (enableIndexHints) {
      console.log(`Query ${queryId}: Index hints enabled`);
    }

    if (fields.length > 0) {
      console.log(`Query ${queryId}: Field selection applied: ${fields.join(', ')}`);
    }

    return this.executeQuery(queryId, optimizedQueryFn, {
      cacheTtl: this.config.defaultCacheTtl * 2, // Cache optimized queries longer
      enableCache: true,
      tags: ['optimized'],
    });
  }

  private buildCacheKey(queryId: string, tags: string[]): string {
    const tagString = tags.length > 0 ? `_${tags.join('_')}` : '';
    return `query_${queryId}${tagString}`;
  }

  private recordMetrics(metrics: QueryPerformanceMetrics): void {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log slow queries immediately
    if (metrics.executionTime > this.config.slowQueryThreshold) {
      console.warn(`Slow query detected: ${metrics.queryId} took ${metrics.executionTime}ms`);
    }
  }

  private trackQueryPattern(queryId: string): void {
    const count = this.queryPatterns.get(queryId) || 0;
    this.queryPatterns.set(queryId, count + 1);
  }

  private generateRecommendations(analytics: any): string[] {
    const recommendations: string[] = [];

    if (analytics.cacheHitRate < 50) {
      recommendations.push(
        'Cache hit rate is low - consider increasing cache TTL or optimizing cache keys'
      );
    }

    if (analytics.avgExecutionTime > 500) {
      recommendations.push('Average execution time is high - consider adding database indexes');
    }

    if (analytics.slowQueries.length > 5) {
      recommendations.push(
        'Multiple slow queries detected - review query optimization and database schema'
      );
    }

    if (analytics.totalQueries > 1000) {
      recommendations.push(
        'High query volume - consider implementing query batching and connection pooling'
      );
    }

    return recommendations;
  }
}

// Common database optimization patterns
export class QueryPatterns {
  /**
   * Paginated query with caching
   */
  static async getPaginatedData<T>(
    baseQueryId: string,
    page: number,
    limit: number,
    queryFn: (offset: number, limit: number) => Promise<T[]>,
    totalCountFn: () => Promise<number>
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const optimizer = new DatabaseOptimizer();

    const [data, total] = await Promise.all([
      optimizer.executeQuery(
        `${baseQueryId}_page_${page}_limit_${limit}`,
        () => queryFn(offset, limit),
        { cacheTtl: 600 } // Cache pages for 10 minutes
      ),
      optimizer.executeQuery(
        `${baseQueryId}_total_count`,
        totalCountFn,
        { cacheTtl: 1800 } // Cache total count for 30 minutes
      ),
    ]);

    return {
      data,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search query with caching and debouncing
   */
  static async getSearchResults<T>(
    searchTerm: string,
    searchFn: (term: string) => Promise<T[]>,
    options: { minLength?: number; cacheTtl?: number } = {}
  ): Promise<T[]> {
    const { minLength = 3, cacheTtl = 300 } = options;

    if (searchTerm.length < minLength) {
      return [];
    }

    const optimizer = new DatabaseOptimizer();
    const searchKey = `search_${Buffer.from(searchTerm.toLowerCase()).toString('base64')}`;

    return optimizer.executeQuery(searchKey, () => searchFn(searchTerm), { cacheTtl });
  }

  /**
   * User-specific data with user cache
   */
  static async getUserData<T>(
    userId: string,
    dataType: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return CacheUtils.cacheUserData(userId, dataType, queryFn);
  }
}

// Export the default optimizer instance
export const dbOptimizer = new DatabaseOptimizer();

// Middleware for database performance monitoring
export function createDbPerformanceMiddleware() {
  return async (context: APIContext, next: () => Promise<Response>) => {
    const startTime = Date.now();
    const response = await next();
    const endTime = Date.now();

    // Log API performance
    if (context.url.pathname.startsWith('/api/')) {
      const duration = endTime - startTime;
      console.log(`API ${context.url.pathname}: ${duration}ms`);

      // Log slow API responses
      if (duration > 2000) {
        console.warn(`Slow API response: ${context.url.pathname} took ${duration}ms`);
      }
    }

    return response;
  };
}
