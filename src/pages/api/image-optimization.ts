// Advanced image optimization API endpoint
import type { APIRoute } from 'astro';
import { getCDNUrl } from '../../utils/cdn-manager';
import {
  generateImageOptimizationReport,
  getImageOptimizationMetrics,
  imageOptimizer,
} from '../../utils/image-optimizer';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation');
    const format = url.searchParams.get('format') || 'json';

    switch (operation) {
      case 'optimize':
        // Single image optimization
        const imagePath = url.searchParams.get('path');
        const width = parseInt(url.searchParams.get('width') || '800');
        const height = parseInt(url.searchParams.get('height') || '0');
        const quality = parseInt(url.searchParams.get('quality') || '85');
        const outputFormat = url.searchParams.get('outputFormat') || 'webp';
        const region = url.searchParams.get('region');
        const enableCDN = url.searchParams.get('cdn') !== 'false';

        if (!imagePath) {
          return new Response(
            JSON.stringify({
              error: 'Image path is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const optimizedSet = await imageOptimizer.generateResponsiveImages(imagePath, {
            alt: 'API optimized image',
            width,
            height: height || undefined,
            region,
            skipCDN: !enableCDN,
          });

          return new Response(
            JSON.stringify({
              success: true,
              originalPath: imagePath,
              optimizedImages: optimizedSet,
              metadata: {
                format: outputFormat,
                quality,
                width,
                height: height || 'auto',
                cdnEnabled: enableCDN,
                region: region || 'auto',
              },
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
              error: 'Image optimization failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'placeholder':
        // Generate placeholder for image
        const placeholderPath = url.searchParams.get('path');
        const placeholderWidth = parseInt(url.searchParams.get('width') || '40');
        const placeholderHeight = parseInt(url.searchParams.get('height') || '30');
        const placeholderType =
          (url.searchParams.get('type') as 'blur' | 'solid' | 'gradient') || 'blur';

        if (!placeholderPath) {
          return new Response(
            JSON.stringify({
              error: 'Image path is required for placeholder generation',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const placeholder = await imageOptimizer.generatePlaceholder(placeholderPath, {
            width: placeholderWidth,
            height: placeholderHeight,
            type: placeholderType,
          });

          return new Response(
            JSON.stringify({
              success: true,
              originalPath: placeholderPath,
              placeholder,
              metadata: {
                width: placeholderWidth,
                height: placeholderHeight,
                type: placeholderType,
              },
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
              error: 'Placeholder generation failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'metrics':
        // Get image optimization metrics
        const metrics = getImageOptimizationMetrics();

        return new Response(
          JSON.stringify({
            success: true,
            metrics,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'report':
        // Generate comprehensive optimization report
        const report = generateImageOptimizationReport();

        if (format === 'markdown') {
          return new Response(report, {
            status: 200,
            headers: {
              'Content-Type': 'text/markdown',
              'Content-Disposition': 'attachment; filename="image-optimization-report.md"',
            },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            report,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'bulk-optimize':
        // Bulk optimization status
        const bulkImages = url.searchParams.getAll('images');

        if (bulkImages.length === 0) {
          return new Response(
            JSON.stringify({
              error: 'No images specified for bulk optimization',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const bulkResults = await imageOptimizer.optimizeBulk(bulkImages);

          return new Response(
            JSON.stringify({
              success: true,
              totalImages: bulkImages.length,
              results: bulkResults,
              summary: {
                totalOriginalSize: bulkResults.reduce((sum, r) => sum + r.savings.originalSize, 0),
                totalOptimizedSize: bulkResults.reduce(
                  (sum, r) => sum + r.savings.optimizedSize,
                  0
                ),
                totalSavings: bulkResults.reduce(
                  (sum, r) => sum + (r.savings.originalSize - r.savings.optimizedSize),
                  0
                ),
                averageCompression:
                  bulkResults.reduce((sum, r) => sum + r.savings.compressionRatio, 0) /
                  bulkResults.length,
              },
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
              error: 'Bulk optimization failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'health':
        // Image optimization service health check
        const healthData = {
          status: 'healthy',
          cacheSize: imageOptimizer.getOptimizationMetrics().totalImages,
          cacheHitRate: imageOptimizer.getOptimizationMetrics().cacheHitRate,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        };

        return new Response(JSON.stringify(healthData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid operation',
            availableOperations: [
              'optimize',
              'placeholder',
              'metrics',
              'report',
              'bulk-optimize',
              'health',
            ],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Image optimization API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Image optimization service error',
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
      case 'bulk-optimize':
        // Bulk image optimization
        const images = body.images || [];
        const _options = body.options || {};

        if (!Array.isArray(images) || images.length === 0) {
          return new Response(
            JSON.stringify({
              error: 'Images array is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const results = await imageOptimizer.optimizeBulk(images);

          const summary = {
            totalImages: images.length,
            successfulOptimizations: results.length,
            totalOriginalSize: results.reduce((sum, r) => sum + r.savings.originalSize, 0),
            totalOptimizedSize: results.reduce((sum, r) => sum + r.savings.optimizedSize, 0),
            totalSavings: results.reduce(
              (sum, r) => sum + (r.savings.originalSize - r.savings.optimizedSize),
              0
            ),
            averageCompressionRatio:
              results.length > 0
                ? results.reduce((sum, r) => sum + r.savings.compressionRatio, 0) / results.length
                : 0,
          };

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Bulk optimization completed',
              results,
              summary,
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
              error: 'Bulk optimization failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'clear-cache':
        // Clear image optimization cache
        try {
          imageOptimizer.clearCache();

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Image optimization cache cleared',
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
              error: 'Cache clear failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'update-config':
        // Update optimization configuration
        const newConfig = body.config || {};

        try {
          imageOptimizer.updateConfig(newConfig);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Configuration updated successfully',
              newConfig,
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
              error: 'Configuration update failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'generate-responsive-set':
        // Generate complete responsive image set
        const imagePath = body.imagePath;
        const setOptions = body.options || {};

        if (!imagePath) {
          return new Response(
            JSON.stringify({
              error: 'Image path is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          const responsiveSet = await imageOptimizer.generateResponsiveImages(imagePath, {
            alt: setOptions.alt || 'Responsive image',
            width: setOptions.width,
            height: setOptions.height,
            priority: setOptions.priority || false,
            className: setOptions.className,
            region: setOptions.region,
          });

          const placeholder = setOptions.enablePlaceholder
            ? await imageOptimizer.generatePlaceholder(imagePath)
            : null;

          return new Response(
            JSON.stringify({
              success: true,
              imagePath,
              responsiveSet,
              placeholder,
              htmlElement: imageOptimizer.generatePictureElement(responsiveSet, {
                alt: setOptions.alt || 'Responsive image',
                className: setOptions.className,
                loading: setOptions.loading || 'lazy',
                priority: setOptions.priority || false,
              }),
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
              error: 'Responsive set generation failed',
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
            error: 'Invalid action',
            availableActions: [
              'bulk-optimize',
              'clear-cache',
              'update-config',
              'generate-responsive-set',
            ],
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Image optimization operation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Image optimization operation failed',
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
