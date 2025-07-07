/**
 * Newsletter Security Metrics API
 * 
 * Provides security analytics and monitoring data for the newsletter API.
 * This endpoint should be secured and only accessible by administrators.
 */

import * as Sentry from '@sentry/node';
import type { APIRoute } from 'astro';

export const prerender = false;

// Simple admin authentication (in production, use proper JWT/session auth)
function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.NEWSLETTER_ADMIN_TOKEN;
  
  if (!adminToken) {
    return false; // No admin token configured
  }
  
  return authHeader === `Bearer ${adminToken}`;
}

export const GET: APIRoute = async ({ request }) => {
  // Security headers
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  // Check authentication
  if (!isAuthenticated(request)) {
    // Log unauthorized access attempt
    Sentry.captureMessage('Unauthorized access attempt to newsletter metrics', {
      level: 'warning',
      tags: {
        endpoint: 'newsletter_metrics',
        auth_failure: 'missing_or_invalid_token',
      },
      extra: {
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unauthorized',
      }),
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    // Import SecurityMonitor from newsletter API
    const { SecurityMonitor } = await import('./newsletter');
    const monitor = SecurityMonitor.getInstance();
    
    // Get security metrics
    const metrics = await monitor.getSecurityMetrics();
    
    if (!metrics) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No metrics available',
        }),
        { status: 404, headers: securityHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...metrics,
          generated_at: new Date().toISOString(),
        },
      }),
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Failed to get security metrics:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'newsletter_metrics',
        operation: 'get_metrics',
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
      }),
      { status: 500, headers: securityHeaders }
    );
  }
};

// Optional: Clear security events (for testing/maintenance)
export const DELETE: APIRoute = async ({ request }) => {
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  if (!isAuthenticated(request)) {
    // Log unauthorized deletion attempt
    Sentry.captureMessage('Unauthorized attempt to delete security events', {
      level: 'error',
      tags: {
        endpoint: 'newsletter_metrics',
        operation: 'delete_events',
        auth_failure: 'missing_or_invalid_token',
      },
      extra: {
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unauthorized',
      }),
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    // Clear security events from Redis
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    await redis.del('newsletter:security_events');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Security events cleared',
      }),
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Failed to clear security events:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'newsletter_metrics',
        operation: 'delete_events',
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
      }),
      { status: 500, headers: securityHeaders }
    );
  }
};