// API endpoint for database optimization and management
import type { APIRoute } from 'astro';
import { analyzeSlowQuery, dbIndexManager, optimizeDatabase } from '../../utils/database-indexes';
import { dbOptimizer } from '../../utils/database-optimizer';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation');
    const detailed = url.searchParams.get('detailed') === 'true';

    switch (operation) {
      case 'performance':
        // Get database performance analytics
        const analytics = dbOptimizer.getPerformanceAnalytics();
        return new Response(JSON.stringify(analytics, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'indexes':
        // Get index statistics
        const indexStats = await dbIndexManager.getIndexStats();
        const unusedIndexes = await dbIndexManager.findUnusedIndexes();

        const response = {
          indexStats,
          unusedIndexes,
          summary: {
            totalIndexes: indexStats.length,
            unusedIndexes: unusedIndexes.length,
            totalScans: indexStats.reduce((sum, idx) => sum + idx.scans, 0),
            potentialSavings: unusedIndexes.reduce((sum, idx) => sum + idx.sizeBytes, 0),
          },
        };

        return new Response(JSON.stringify(response, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'report':
        // Generate comprehensive optimization report
        const performanceReport = dbOptimizer.generatePerformanceReport();
        const indexReport = await dbIndexManager.generateOptimizationReport();

        const combinedReport = {
          timestamp: new Date().toISOString(),
          performance: performanceReport,
          indexes: indexReport,
          recommendations: await generateCombinedRecommendations(),
        };

        if (detailed) {
          // Include additional detailed information
          (combinedReport as any).detailed = {
            definedIndexes: dbIndexManager.getDefinedIndexes(),
            queryPatterns: dbOptimizer.getPerformanceAnalytics().topQueries,
          };
        }

        return new Response(JSON.stringify(combinedReport, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'health':
        // Database health check
        const health = await performHealthCheck();
        return new Response(JSON.stringify(health, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid operation',
            availableOperations: ['performance', 'indexes', 'report', 'health'],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Database optimization API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch database optimization data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'optimize':
        // Run database optimization
        const optimizationResult = await optimizeDatabase();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Database optimization completed',
            result: optimizationResult,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'create_indexes':
        // Create specific indexes
        const indexNames = body.indexes || [];
        const createResult = await dbIndexManager.createIndexes(indexNames);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Index creation completed',
            created: createResult.created,
            failed: createResult.failed,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'drop_indexes':
        // Drop specific indexes
        const indexesToDrop = body.indexes || [];
        const dropResult = await dbIndexManager.dropIndexes(indexesToDrop);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Index removal completed',
            dropped: dropResult.dropped,
            failed: dropResult.failed,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'analyze_query':
        // Analyze specific query
        const sql = body.sql;
        if (!sql) {
          return new Response(
            JSON.stringify({
              error: 'SQL query is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const queryAnalysis = await analyzeSlowQuery(sql);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Query analysis completed',
            analysis: queryAnalysis,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'vacuum_analyze':
        // Run VACUUM ANALYZE
        await runVacuumAnalyze();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'VACUUM ANALYZE completed successfully',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'clear_metrics':
        // Clear performance metrics
        dbOptimizer.clearMetrics();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Performance metrics cleared',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'preload_cache':
        // Preload frequently accessed data
        const preloadQueries = [
          {
            key: 'newsletter_count',
            queryFn: async () => {
              // Simulate getting newsletter subscriber count
              return { count: 0 };
            },
            ttl: 3600,
          },
          {
            key: 'recent_posts',
            queryFn: async () => {
              // Simulate getting recent blog posts
              return { posts: [] };
            },
            ttl: 1800,
          },
        ];

        await dbOptimizer.preloadData(preloadQueries);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Cache preloading completed',
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
            availableActions: [
              'optimize',
              'create_indexes',
              'drop_indexes',
              'analyze_query',
              'vacuum_analyze',
              'clear_metrics',
              'preload_cache',
            ],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Database optimization operation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Database optimization operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Helper function to perform health check
async function performHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  checks: Array<{ name: string; status: string; details?: any }>;
  score: number;
}> {
  const checks = [];
  let score = 100;

  try {
    // Check database connection
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      checks.push({
        name: 'Database Connection',
        status: 'healthy',
        details: { connectedAt: result.rows[0].now },
      });
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'critical',
        details: { error: error.message },
      });
      score -= 50;
    } finally {
      await pool.end();
    }
  } catch (_error) {
    checks.push({
      name: 'Database Connection',
      status: 'critical',
      details: { error: 'Failed to establish connection' },
    });
    score -= 50;
  }

  // Check query performance
  const analytics = dbOptimizer.getPerformanceAnalytics();
  if (analytics.avgExecutionTime > 1000) {
    checks.push({
      name: 'Query Performance',
      status: 'warning',
      details: { avgExecutionTime: analytics.avgExecutionTime },
    });
    score -= 20;
  } else {
    checks.push({
      name: 'Query Performance',
      status: 'healthy',
      details: { avgExecutionTime: analytics.avgExecutionTime },
    });
  }

  // Check cache hit rate
  if (analytics.cacheHitRate < 50) {
    checks.push({
      name: 'Cache Performance',
      status: 'warning',
      details: { cacheHitRate: analytics.cacheHitRate },
    });
    score -= 15;
  } else {
    checks.push({
      name: 'Cache Performance',
      status: 'healthy',
      details: { cacheHitRate: analytics.cacheHitRate },
    });
  }

  // Check for slow queries
  if (analytics.slowQueries.length > 5) {
    checks.push({
      name: 'Slow Queries',
      status: 'warning',
      details: { slowQueryCount: analytics.slowQueries.length },
    });
    score -= 15;
  } else {
    checks.push({
      name: 'Slow Queries',
      status: 'healthy',
      details: { slowQueryCount: analytics.slowQueries.length },
    });
  }

  const status = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical';

  return { status, checks, score };
}

// Helper function to run VACUUM ANALYZE
async function runVacuumAnalyze(): Promise<void> {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const client = await pool.connect();

    // Get all user tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    // Run VACUUM ANALYZE on each table
    for (const row of tablesResult.rows) {
      const tableName = row.tablename;
      console.log(`Running VACUUM ANALYZE on ${tableName}`);
      await client.query(`VACUUM ANALYZE ${tableName}`);
    }

    client.release();
    console.log('VACUUM ANALYZE completed for all tables');
  } finally {
    await pool.end();
  }
}

// Helper function to generate combined recommendations
async function generateCombinedRecommendations(): Promise<string[]> {
  const recommendations: string[] = [];

  const analytics = dbOptimizer.getPerformanceAnalytics();
  const unusedIndexes = await dbIndexManager.findUnusedIndexes();

  // Performance recommendations
  if (analytics.avgExecutionTime > 500) {
    recommendations.push(
      'Average query execution time is high - review slow queries and add indexes'
    );
  }

  if (analytics.cacheHitRate < 70) {
    recommendations.push(
      'Cache hit rate is low - consider increasing cache TTL or improving cache strategies'
    );
  }

  // Index recommendations
  if (unusedIndexes.length > 0) {
    recommendations.push(
      `${unusedIndexes.length} unused indexes found - consider dropping them to save storage`
    );
  }

  if (analytics.slowQueries.length > 3) {
    recommendations.push(
      'Multiple slow queries detected - run query analysis and add appropriate indexes'
    );
  }

  // General recommendations
  recommendations.push('Run VACUUM ANALYZE regularly to maintain query planner statistics');
  recommendations.push(
    'Monitor database performance continuously and adjust indexes based on usage patterns'
  );
  recommendations.push('Consider implementing connection pooling for high-traffic applications');

  return recommendations;
}
