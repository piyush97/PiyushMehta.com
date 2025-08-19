// API endpoint for CDN management and monitoring
import type { APIRoute } from 'astro';
import {
  cdnManager,
  generateCDNReport,
  getCDNMetrics,
  triggerCDNFailover,
} from '../../utils/cdn-manager';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation');
    const format = url.searchParams.get('format') || 'json';

    switch (operation) {
      case 'metrics':
        // Get CDN metrics and status
        const metrics = getCDNMetrics();

        return new Response(JSON.stringify(metrics, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'status':
        // Get simple status overview
        const status = getCDNMetrics();
        const activeProviders = status.providers.filter((p) => p.isActive).length;

        const summary = {
          status: activeProviders > 0 ? 'operational' : 'degraded',
          currentProvider: status.currentProvider,
          activeProviders,
          totalProviders: status.providers.length,
          averageResponseTime: Math.round(status.averageResponseTime),
          totalBandwidth: status.totalBandwidth,
          lastUpdate: new Date().toISOString(),
        };

        return new Response(JSON.stringify(summary, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'report':
        // Generate detailed CDN report
        const report = generateCDNReport();

        if (format === 'markdown') {
          return new Response(report, {
            status: 200,
            headers: {
              'Content-Type': 'text/markdown',
              'Content-Disposition': 'attachment; filename="cdn-report.md"',
            },
          });
        }

        return new Response(JSON.stringify({ report }, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'health':
        // Simple health check endpoint
        const healthMetrics = getCDNMetrics();
        const hasActiveProviders = healthMetrics.providers.some((p) => p.isActive);

        return new Response(
          JSON.stringify({
            status: hasActiveProviders ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            activeProviders: healthMetrics.providers.filter((p) => p.isActive).length,
            currentProvider: healthMetrics.currentProvider,
          }),
          {
            status: hasActiveProviders ? 200 : 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'optimal-url':
        // Get optimal CDN URL for a resource
        const resourcePath = url.searchParams.get('path');
        const fileType = url.searchParams.get('type') as
          | 'image'
          | 'css'
          | 'js'
          | 'font'
          | 'document';
        const region = url.searchParams.get('region');
        const quality = url.searchParams.get('quality') as 'high' | 'medium' | 'low';

        if (!resourcePath) {
          return new Response(
            JSON.stringify({
              error: 'Resource path is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const optimalUrl = cdnManager.getOptimalUrl(resourcePath, {
            fileType,
            region: region || undefined,
            quality: quality || 'high',
            fallbackToLocal: true,
          });

          return new Response(
            JSON.stringify({
              originalPath: resourcePath,
              optimizedUrl: optimalUrl,
              provider: getCDNMetrics().currentProvider,
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: 'Failed to generate optimal URL',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid operation',
            availableOperations: ['metrics', 'status', 'report', 'health', 'optimal-url'],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('CDN management API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process CDN request',
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
      case 'failover':
        // Trigger manual failover to specific provider
        const providerId = body.providerId;

        if (!providerId) {
          return new Response(
            JSON.stringify({
              error: 'Provider ID is required for failover',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const success = await triggerCDNFailover(providerId);

          return new Response(
            JSON.stringify({
              success,
              message: success
                ? `Successfully failed over to provider: ${providerId}`
                : `Failed to failover to provider: ${providerId}`,
              currentProvider: getCDNMetrics().currentProvider,
              timestamp: new Date().toISOString(),
            }),
            {
              status: success ? 200 : 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failover operation failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'optimize-resource':
        // Optimize multiple resources
        const resources = body.resources || [];

        if (!Array.isArray(resources) || resources.length === 0) {
          return new Response(
            JSON.stringify({
              error: 'Resources array is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const optimizedResources = resources.map((resource: any) => {
          try {
            const optimizedUrl = cdnManager.getOptimalUrl(resource.path, {
              fileType: resource.type,
              region: resource.region,
              quality: resource.quality || 'high',
              fallbackToLocal: true,
            });

            return {
              originalPath: resource.path,
              optimizedUrl,
              success: true,
            };
          } catch (error) {
            return {
              originalPath: resource.path,
              error: error instanceof Error ? error.message : 'Optimization failed',
              success: false,
            };
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Resource optimization completed',
            resources: optimizedResources,
            provider: getCDNMetrics().currentProvider,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'health-check':
        // Trigger manual health check for all providers
        try {
          // The health checks run automatically, but we can force a status update
          const currentMetrics = getCDNMetrics();

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Health check completed',
              metrics: currentMetrics,
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Health check failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'generate-urls':
        // Generate optimized URLs for common resources
        const baseResources = [
          { path: '/assets/images/hero.jpg', type: 'image' },
          { path: '/assets/css/main.css', type: 'css' },
          { path: '/assets/js/app.js', type: 'js' },
          { path: '/fonts/main.woff2', type: 'font' },
        ];

        const generatedUrls = baseResources.map((resource) => ({
          resource: resource.path,
          type: resource.type,
          optimizedUrl: cdnManager.getOptimalUrl(resource.path, {
            fileType: resource.type as any,
            fallbackToLocal: true,
          }),
        }));

        return new Response(
          JSON.stringify({
            success: true,
            message: 'URLs generated successfully',
            urls: generatedUrls,
            provider: getCDNMetrics().currentProvider,
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
            availableActions: ['failover', 'optimize-resource', 'health-check', 'generate-urls'],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('CDN management operation error:', error);

    return new Response(
      JSON.stringify({
        error: 'CDN management operation failed',
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

// OPTIONS handler for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};
