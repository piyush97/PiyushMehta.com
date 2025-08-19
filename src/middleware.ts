// Main middleware configuration for Astro

import { defineMiddleware, sequence } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { createCacheInvalidationMiddleware } from './lib/redis-cache';
import { rateLimitMiddleware, strictRateLimitMiddleware } from './middleware/advanced-rate-limit';
import { securityHeaders } from './middleware/security';
import { securityMonitorMiddleware } from './middleware/security-monitor';
import { createDbPerformanceMiddleware } from './utils/database-optimizer';

// Security monitoring (runs first)
const securityMonitor = defineMiddleware(securityMonitorMiddleware);

// Enhanced security headers
const security = defineMiddleware(securityHeaders);

// Rate limiting with different levels based on endpoint
const rateLimiting = defineMiddleware(
  async (
    context: APIContext<Record<string, unknown>, Record<string, string | undefined>>,
    next: MiddlewareNext
  ) => {
    const path = context.url.pathname;

    // Skip rate limiting for prerendered pages and static assets
    if (!context.request || path.startsWith('/_') || path.includes('.')) {
      return next();
    }

    // Apply strict rate limiting to sensitive endpoints
    const strictPaths = ['/api/newsletter', '/api/auth', '/api/admin', '/api/upload'];

    if (strictPaths.some((strictPath) => path.startsWith(strictPath))) {
      return strictRateLimitMiddleware(context, next);
    }

    // Apply standard rate limiting to other API endpoints
    if (path.startsWith('/api/')) {
      return rateLimitMiddleware(context, next);
    }

    // No rate limiting for static assets and pages
    return next();
  }
);

// Cache invalidation middleware
const cacheInvalidation = defineMiddleware(createCacheInvalidationMiddleware());

// Database performance monitoring middleware
const dbPerformanceMonitor = defineMiddleware(createDbPerformanceMiddleware());

// Request logging middleware
const requestLogger = defineMiddleware(
  async (
    context: { url: { pathname: string }; request: { method: string } },
    next: () => Response | Promise<Response>
  ) => {
    const startTime = Date.now();
    const response = await next();

    // Only log in development or for API routes
    if (process.env.NODE_ENV === 'development' || context.url.pathname.startsWith('/api/')) {
      const duration = Date.now() - startTime;
      const status = response instanceof Response ? response.status : 200;

      console.log(
        `${context.request?.method || 'GET'} ${context.url.pathname} - ${status} (${duration}ms)`
      );
    }

    return response;
  }
);

// CORS middleware for API routes
const corsMiddleware = defineMiddleware(
  async (
    context: {
      url: { pathname: string };
      request: { headers: { get: (name: string) => string | null }; method: string };
    },
    next: () => Response | Promise<Response>
  ) => {
    // Only apply CORS to API routes
    if (!context.url.pathname.startsWith('/api/')) {
      return next();
    }

    const response = await next();

    if (response instanceof Response) {
      // Clone response to modify headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Get origin from request
      const origin = context.request?.headers.get('origin');
      const allowedOrigins = [
        'https://piyushmehta.com',
        'https://www.piyushmehta.com',
        ...(process.env.NODE_ENV === 'development'
          ? ['http://localhost:4321', 'http://127.0.0.1:4321']
          : []),
      ];

      // Set CORS headers
      if (origin && allowedOrigins.includes(origin)) {
        newResponse.headers.set('Access-Control-Allow-Origin', origin);
      }

      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      newResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

      // Handle preflight requests
      if (context.request?.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: newResponse.headers,
        });
      }

      return newResponse;
    }

    return response;
  }
);

// Error handling middleware
const errorHandler = defineMiddleware(
  async (
    context: {
      url: { pathname: string };
      request: { method: string; headers: { get: (name: string) => string | null } };
    },
    next: () => Response | Promise<Response>
  ) => {
    try {
      return await next();
    } catch (error) {
      console.error('Middleware error:', error);

      // Log error details for monitoring
      const errorDetails = {
        timestamp: new Date().toISOString(),
        path: context.url.pathname,
        method: context.request?.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: context.request?.headers.get('user-agent'),
        ip:
          context.request?.headers.get('x-forwarded-for') ||
          context.request?.headers.get('x-real-ip') ||
          context.request?.headers.get('cf-connecting-ip'),
      };

      console.error('Request error details:', errorDetails);

      // Return appropriate error response
      if (context.url.pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message:
              process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // For non-API routes, let Astro handle the error
      throw error;
    }
  }
);

// Combine all middleware in the correct order
export const onRequest = sequence(
  errorHandler, // Wrap everything in error handling
  securityMonitor, // Monitor security first
  security, // Apply security headers
  corsMiddleware, // Handle CORS for API routes
  rateLimiting, // Apply rate limiting
  dbPerformanceMonitor, // Monitor database performance
  cacheInvalidation, // Handle cache invalidation
  requestLogger // Log requests last
);

// Export middleware for direct use if needed
export {
  cacheInvalidation,
  corsMiddleware,
  dbPerformanceMonitor,
  errorHandler,
  rateLimiting,
  requestLogger,
  security,
  securityMonitor,
};
