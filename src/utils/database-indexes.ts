// Database indexing and query optimization utilities
import { dbOptimizer } from './database-optimizer';

interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
  unique?: boolean;
  partial?: string; // WHERE clause for partial indexes
  concurrent?: boolean;
}

interface QueryOptimization {
  table: string;
  queryPattern: string;
  recommendedIndexes: IndexDefinition[];
  expectedImprovement: string;
}

export class DatabaseIndexManager {
  private indexes: Map<string, IndexDefinition> = new Map();
  private recommendations: QueryOptimization[] = [];

  constructor() {
    this.initializeCommonIndexes();
  }

  /**
   * Initialize common indexes for the application
   */
  private initializeCommonIndexes(): void {
    const commonIndexes: IndexDefinition[] = [
      // Newsletter subscribers indexes
      {
        name: 'idx_newsletter_email',
        table: 'newsletter_subscribers',
        columns: ['email'],
        type: 'btree',
        unique: true,
      },
      {
        name: 'idx_newsletter_active_subscribed',
        table: 'newsletter_subscribers',
        columns: ['is_active', 'subscribed_at'],
        type: 'btree',
      },
      {
        name: 'idx_newsletter_source',
        table: 'newsletter_subscribers',
        columns: ['source'],
        type: 'btree',
      },

      // Blog posts indexes (if you have a blog posts table)
      {
        name: 'idx_blog_posts_slug',
        table: 'blog_posts',
        columns: ['slug'],
        type: 'btree',
        unique: true,
      },
      {
        name: 'idx_blog_posts_published',
        table: 'blog_posts',
        columns: ['published', 'published_at'],
        type: 'btree',
      },
      {
        name: 'idx_blog_posts_tags',
        table: 'blog_posts',
        columns: ['tags'],
        type: 'gin', // For JSON/array operations
      },

      // Comments system indexes (if you have comments)
      {
        name: 'idx_comments_post_created',
        table: 'comments',
        columns: ['post_id', 'created_at'],
        type: 'btree',
      },
      {
        name: 'idx_comments_approved',
        table: 'comments',
        columns: ['approved'],
        type: 'btree',
        partial: 'approved = true',
      },

      // Session/auth indexes
      {
        name: 'idx_sessions_token',
        table: 'sessions',
        columns: ['token'],
        type: 'btree',
        unique: true,
      },
      {
        name: 'idx_sessions_expires',
        table: 'sessions',
        columns: ['expires_at'],
        type: 'btree',
      },

      // Analytics/logging indexes
      {
        name: 'idx_page_views_created',
        table: 'page_views',
        columns: ['created_at'],
        type: 'btree',
      },
      {
        name: 'idx_page_views_path_date',
        table: 'page_views',
        columns: ['path', 'created_at'],
        type: 'btree',
      },
    ];

    commonIndexes.forEach((index) => {
      this.indexes.set(index.name, index);
    });
  }

  /**
   * Create indexes in the database
   */
  async createIndexes(indexNames?: string[]): Promise<{
    created: string[];
    failed: Array<{ name: string; error: string }>;
  }> {
    const indexesToCreate = indexNames
      ? (indexNames.map((name) => this.indexes.get(name)).filter(Boolean) as IndexDefinition[])
      : Array.from(this.indexes.values());

    const created: string[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (const index of indexesToCreate) {
      try {
        await this.createSingleIndex(index);
        created.push(index.name);
      } catch (error) {
        failed.push({
          name: index.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { created, failed };
  }

  /**
   * Create a single index
   */
  private async createSingleIndex(index: IndexDefinition): Promise<void> {
    const sql = this.generateCreateIndexSQL(index);

    await dbOptimizer.executeQuery(
      `create_index_${index.name}`,
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });

        try {
          const client = await pool.connect();
          await client.query(sql);
          client.release();
          console.log(`Created index: ${index.name}`);
        } finally {
          await pool.end();
        }
      },
      { enableCache: false }
    );
  }

  /**
   * Generate CREATE INDEX SQL
   */
  private generateCreateIndexSQL(index: IndexDefinition): string {
    const uniqueKeyword = index.unique ? 'UNIQUE ' : '';
    const concurrentKeyword = index.concurrent ? 'CONCURRENTLY ' : '';
    const columnsStr = index.columns.join(', ');
    const typeClause = index.type !== 'btree' ? ` USING ${index.type}` : '';
    const whereClause = index.partial ? ` WHERE ${index.partial}` : '';

    return `CREATE ${uniqueKeyword}INDEX ${concurrentKeyword}IF NOT EXISTS ${index.name} ON ${index.table}${typeClause} (${columnsStr})${whereClause};`;
  }

  /**
   * Drop indexes
   */
  async dropIndexes(indexNames: string[]): Promise<{
    dropped: string[];
    failed: Array<{ name: string; error: string }>;
  }> {
    const dropped: string[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (const indexName of indexNames) {
      try {
        await this.dropSingleIndex(indexName);
        dropped.push(indexName);
      } catch (error) {
        failed.push({
          name: indexName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { dropped, failed };
  }

  /**
   * Drop a single index
   */
  private async dropSingleIndex(indexName: string): Promise<void> {
    await dbOptimizer.executeQuery(
      `drop_index_${indexName}`,
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });

        try {
          const client = await pool.connect();
          await client.query(`DROP INDEX IF EXISTS ${indexName};`);
          client.release();
          console.log(`Dropped index: ${indexName}`);
        } finally {
          await pool.end();
        }
      },
      { enableCache: false }
    );
  }

  /**
   * Analyze query performance and suggest indexes
   */
  async analyzeQuery(sql: string): Promise<{
    executionPlan: any;
    recommendations: string[];
    estimatedCost: number;
  }> {
    return dbOptimizer.executeQuery(
      `analyze_query_${Buffer.from(sql).toString('base64').slice(0, 20)}`,
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });

        try {
          const client = await pool.connect();

          // Get execution plan
          const explainResult = await client.query(
            `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`
          );
          const executionPlan = explainResult.rows[0]['QUERY PLAN'][0];

          const recommendations = this.generateIndexRecommendations(executionPlan);
          const estimatedCost = executionPlan['Total Cost'] || 0;

          client.release();
          return { executionPlan, recommendations, estimatedCost };
        } finally {
          await pool.end();
        }
      },
      { cacheTtl: 3600 } // Cache analysis for 1 hour
    );
  }

  /**
   * Generate index recommendations based on execution plan
   */
  private generateIndexRecommendations(executionPlan: any): string[] {
    const recommendations: string[] = [];

    // Analyze the execution plan for optimization opportunities
    if (executionPlan.Plan) {
      this.analyzeExecutionPlanNode(executionPlan.Plan, recommendations);
    }

    return recommendations;
  }

  /**
   * Recursively analyze execution plan nodes
   */
  private analyzeExecutionPlanNode(node: any, recommendations: string[]): void {
    // Check for sequential scans
    if (node['Node Type'] === 'Seq Scan') {
      const tableName = node['Relation Name'];
      const filter = node['Filter'];

      if (filter && tableName) {
        recommendations.push(
          `Consider adding an index on table '${tableName}' for filter condition: ${filter}`
        );
      }
    }

    // Check for sorts that could benefit from indexes
    if (node['Node Type'] === 'Sort') {
      const sortKey = node['Sort Key'];
      if (sortKey && sortKey.length > 0) {
        recommendations.push(
          `Consider adding an index for sort operations on: ${sortKey.join(', ')}`
        );
      }
    }

    // Check for hash joins that might benefit from indexes
    if (node['Node Type'] === 'Hash Join') {
      const hashCond = node['Hash Cond'];
      if (hashCond) {
        recommendations.push(`Consider optimizing join condition with indexes: ${hashCond}`);
      }
    }

    // Recursively analyze child nodes
    if (node.Plans) {
      node.Plans.forEach((childNode: any) => {
        this.analyzeExecutionPlanNode(childNode, recommendations);
      });
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexStats(): Promise<
    Array<{
      schemaName: string;
      tableName: string;
      indexName: string;
      scans: number;
      tuplesRead: number;
      tuplesReturned: number;
      sizeBytes: number;
    }>
  > {
    return dbOptimizer.executeQuery(
      'index_statistics',
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });

        try {
          const client = await pool.connect();

          const result = await client.query(`
            SELECT 
              schemaname as schema_name,
              tablename as table_name,
              indexname as index_name,
              idx_scan as scans,
              idx_tup_read as tuples_read,
              idx_tup_fetch as tuples_returned,
              pg_relation_size(indexrelid) as size_bytes
            FROM pg_stat_user_indexes 
            ORDER BY idx_scan DESC;
          `);

          client.release();
          return result.rows;
        } finally {
          await pool.end();
        }
      },
      { cacheTtl: 300 } // Cache for 5 minutes
    );
  }

  /**
   * Find unused indexes
   */
  async findUnusedIndexes(): Promise<
    Array<{
      schemaName: string;
      tableName: string;
      indexName: string;
      sizeBytes: number;
    }>
  > {
    return dbOptimizer.executeQuery(
      'unused_indexes',
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });

        try {
          const client = await pool.connect();

          const result = await client.query(`
            SELECT 
              schemaname as schema_name,
              tablename as table_name,
              indexname as index_name,
              pg_relation_size(indexrelid) as size_bytes
            FROM pg_stat_user_indexes 
            WHERE idx_scan = 0
              AND indexname NOT LIKE '%_pkey' -- Exclude primary keys
            ORDER BY pg_relation_size(indexrelid) DESC;
          `);

          client.release();
          return result.rows;
        } finally {
          await pool.end();
        }
      },
      { cacheTtl: 1800 } // Cache for 30 minutes
    );
  }

  /**
   * Generate optimization report
   */
  async generateOptimizationReport(): Promise<string> {
    const [indexStats, unusedIndexes] = await Promise.all([
      this.getIndexStats(),
      this.findUnusedIndexes(),
    ]);

    const totalIndexSize = indexStats.reduce((sum, idx) => sum + idx.sizeBytes, 0);
    const unusedIndexSize = unusedIndexes.reduce((sum, idx) => sum + idx.sizeBytes, 0);

    return `
# Database Index Optimization Report

## Summary
- **Total Indexes**: ${indexStats.length}
- **Total Index Size**: ${this.formatBytes(totalIndexSize)}
- **Unused Indexes**: ${unusedIndexes.length}
- **Unused Index Size**: ${this.formatBytes(unusedIndexSize)}
- **Space Savings Potential**: ${this.formatBytes(unusedIndexSize)}

## Most Used Indexes
${indexStats
  .slice(0, 10)
  .map(
    (idx) =>
      `- **${idx.indexName}** on ${idx.tableName}: ${idx.scans.toLocaleString()} scans, ${this.formatBytes(idx.sizeBytes)}`
  )
  .join('\n')}

## Unused Indexes (Consider Dropping)
${unusedIndexes
  .map((idx) => `- **${idx.indexName}** on ${idx.tableName}: ${this.formatBytes(idx.sizeBytes)}`)
  .join('\n')}

## Recommendations
${this.generateOptimizationRecommendations(indexStats, unusedIndexes)
  .map((rec) => `- ${rec}`)
  .join('\n')}
`;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(indexStats: any[], unusedIndexes: any[]): string[] {
    const recommendations: string[] = [];

    if (unusedIndexes.length > 0) {
      recommendations.push(
        `Drop ${unusedIndexes.length} unused indexes to save ${this.formatBytes(
          unusedIndexes.reduce((sum, idx) => sum + idx.sizeBytes, 0)
        )} of storage`
      );
    }

    const lowUsageIndexes = indexStats.filter(
      (idx) => idx.scans < 10 && idx.sizeBytes > 1024 * 1024
    );
    if (lowUsageIndexes.length > 0) {
      recommendations.push(
        `Review ${lowUsageIndexes.length} indexes with low usage but high storage cost`
      );
    }

    const duplicateTables = new Set();
    const tableIndexCounts = new Map<string, number>();
    indexStats.forEach((idx) => {
      const count = tableIndexCounts.get(idx.tableName) || 0;
      tableIndexCounts.set(idx.tableName, count + 1);
      if (count > 5) duplicateTables.add(idx.tableName);
    });

    if (duplicateTables.size > 0) {
      recommendations.push(
        `Review tables with many indexes: ${Array.from(duplicateTables).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get all defined indexes
   */
  getDefinedIndexes(): IndexDefinition[] {
    return Array.from(this.indexes.values());
  }

  /**
   * Add custom index definition
   */
  addIndexDefinition(index: IndexDefinition): void {
    this.indexes.set(index.name, index);
  }
}

// Export the default instance
export const dbIndexManager = new DatabaseIndexManager();

// Utility functions for common operations
export async function optimizeDatabase(): Promise<{
  indexesCreated: string[];
  indexesDropped: string[];
  recommendations: string[];
}> {
  const created = await dbIndexManager.createIndexes();
  const unusedIndexes = await dbIndexManager.findUnusedIndexes();

  // Drop unused indexes (be careful in production)
  const dropped = await dbIndexManager.dropIndexes(unusedIndexes.map((idx) => idx.indexName));

  const recommendations = [
    `Created ${created.created.length} indexes`,
    `Dropped ${dropped.dropped.length} unused indexes`,
    'Run VACUUM ANALYZE after index changes',
    'Monitor query performance for 24-48 hours',
  ];

  return {
    indexesCreated: created.created,
    indexesDropped: dropped.dropped,
    recommendations,
  };
}

export async function analyzeSlowQuery(sql: string): Promise<{
  analysis: any;
  optimizationSuggestions: string[];
}> {
  const analysis = await dbIndexManager.analyzeQuery(sql);

  const suggestions = [
    ...analysis.recommendations,
    analysis.estimatedCost > 1000 ? 'Query cost is high - consider optimization' : '',
    'Consider using LIMIT for large result sets',
    'Ensure WHERE clauses use indexed columns',
  ].filter(Boolean);

  return {
    analysis: analysis.executionPlan,
    optimizationSuggestions: suggestions,
  };
}
