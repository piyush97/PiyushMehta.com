// API endpoint for cache performance monitoring
import type { APIRoute } from 'astro';
import { contentCache, queryCache, sessionCache, userCache } from '../../lib/redis-cache';
import { dbOptimizer } from '../../utils/database-optimizer';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';

    // Get cache metrics from all cache instances
    const [queryMetrics, userMetrics, contentMetrics, sessionMetrics] = await Promise.all([
      queryCache.getCacheInfo(),
      userCache.getCacheInfo(),
      contentCache.getCacheInfo(),
      sessionCache.getCacheInfo(),
    ]);

    // Get database performance analytics
    const dbAnalytics = dbOptimizer.getPerformanceAnalytics();

    const stats = {
      timestamp: new Date().toISOString(),
      caches: {
        query: {
          ...queryMetrics,
          type: 'Database Queries',
        },
        user: {
          ...userMetrics,
          type: 'User Data',
        },
        content: {
          ...contentMetrics,
          type: 'Content',
        },
        session: {
          ...sessionMetrics,
          type: 'Sessions',
        },
      },
      database: {
        totalQueries: dbAnalytics.totalQueries,
        avgExecutionTime: dbAnalytics.avgExecutionTime,
        cacheHitRate: dbAnalytics.cacheHitRate,
        slowQueriesCount: dbAnalytics.slowQueries.length,
      },
      overall: {
        totalCacheKeys: Object.values(stats?.caches || {}).reduce(
          (sum, cache) => sum + (cache.keyCount || 0),
          0
        ),
        averageHitRate:
          Object.values(stats?.caches || {}).reduce((sum, cache) => sum + (cache.hitRate || 0), 0) /
          4,
        performanceScore: calculatePerformanceScore(dbAnalytics, queryMetrics),
      },
    };

    // Add detailed information if requested
    if (detailed) {
      (stats as any).detailed = {
        database: {
          topQueries: dbAnalytics.topQueries,
          slowQueries: dbAnalytics.slowQueries.slice(0, 5),
          recommendations: generateCacheRecommendations(stats),
        },
      };
    }

    return new Response(JSON.stringify(stats, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Cache stats API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'clear_cache':
        // Clear specific cache or all caches
        const cacheType = body.cacheType;

        if (cacheType === 'all' || !cacheType) {
          await Promise.all([
            queryCache.invalidatePattern('*'),
            userCache.invalidatePattern('*'),
            contentCache.invalidatePattern('*'),
            sessionCache.invalidatePattern('*'),
          ]);
        } else {
          const cacheMap = {
            query: queryCache,
            user: userCache,
            content: contentCache,
            session: sessionCache,
          };

          const cache = cacheMap[cacheType as keyof typeof cacheMap];
          if (cache) {
            await cache.invalidatePattern('*');
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Cache ${cacheType || 'all'} cleared successfully`,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'reset_metrics':
        // Reset database performance metrics
        dbOptimizer.clearMetrics();

        // Reset cache metrics
        queryCache.resetMetrics();
        userCache.resetMetrics();
        contentCache.resetMetrics();
        sessionCache.resetMetrics();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Performance metrics reset successfully',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'warm_cache':
        // Warm cache with frequently accessed data
        const warmingQueries = [
          {
            key: 'blog_posts_list',
            queryFn: async () => {
              // Simulate fetching blog posts
              return { posts: [], total: 0 };
            },
            ttl: 1800,
          },
          {
            key: 'site_config',
            queryFn: async () => {
              // Simulate fetching site configuration
              return { theme: 'dark', features: [] };
            },
            ttl: 3600,
          },
        ];

        await dbOptimizer.preloadData(warmingQueries);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Cache warming completed',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action',
            availableActions: ['clear_cache', 'reset_metrics', 'warm_cache'],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Cache management API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Cache management operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

// Helper function to calculate overall performance score
function calculatePerformanceScore(dbAnalytics: any, cacheInfo: any): number {
  let score = 100;

  // Penalize slow database performance
  if (dbAnalytics.avgExecutionTime > 1000) score -= 20;
  else if (dbAnalytics.avgExecutionTime > 500) score -= 10;

  // Penalize low cache hit rate
  if (dbAnalytics.cacheHitRate < 50) score -= 15;
  else if (dbAnalytics.cacheHitRate < 70) score -= 8;

  // Penalize excessive slow queries
  if (dbAnalytics.slowQueries.length > 10) score -= 15;
  else if (dbAnalytics.slowQueries.length > 5) score -= 8;

  // Bonus for good cache hit rate
  if (cacheInfo.hitRate > 80) score += 5;

  return Math.max(0, Math.min(100, score));
}

// Generate cache optimization recommendations
function generateCacheRecommendations(stats: any): string[] {
  const recommendations: string[] = [];

  const avgHitRate = stats.overall.averageHitRate;
  const totalQueries = stats.database.totalQueries;
  const avgExecutionTime = stats.database.avgExecutionTime;

  if (avgHitRate < 50) {
    recommendations.push('Increase cache TTL values for frequently accessed data');
    recommendations.push('Review cache key strategies to improve hit rates');
  }

  if (avgExecutionTime > 500) {
    recommendations.push('Consider implementing database query optimization');
    recommendations.push('Add database indexes for frequently queried fields');
  }

  if (totalQueries > 1000) {
    recommendations.push('Implement query batching to reduce database load');
    recommendations.push('Consider connection pooling for database queries');
  }

  if (stats.database.slowQueriesCount > 5) {
    recommendations.push('Optimize slow queries identified in the detailed report');
    recommendations.push('Consider implementing pagination for large result sets');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is optimal - continue monitoring');
  }

  return recommendations;
}
