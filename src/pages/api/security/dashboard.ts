// Security dashboard API endpoint
import type { APIRoute } from 'astro';
import { getSecurityMetrics } from '../../../middleware/security-monitor';
import { ipReputationService } from '../../../utils/ip-reputation';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Basic authentication check (in production, use proper auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // In production, validate the token properly
    const token = authHeader.substring(7);
    if (token !== process.env.SECURITY_DASHBOARD_TOKEN) {
      return new Response('Forbidden', { status: 403 });
    }

    // Collect security metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      security: getSecurityMetrics(),
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'unknown',
      },
      config: {
        rateLimitEnabled: process.env.ENABLE_RATE_LIMITING === 'true',
        ipBlockingEnabled: process.env.SECURITY_ENABLE_IP_BLOCKING === 'true',
        botDetectionEnabled: process.env.SECURITY_ENABLE_BOT_DETECTION === 'true',
        geoBlockingEnabled: process.env.SECURITY_ENABLE_GEO_BLOCKING === 'true',
        ctMonitoringEnabled: process.env.SECURITY_ENABLE_CT_MONITORING === 'true',
        cspReportOnly: process.env.SECURITY_CSP_REPORT_ONLY === 'true',
      },
      thresholds: {
        ipReputationThreshold: parseFloat(process.env.SECURITY_IP_REPUTATION_THRESHOLD || '0.7'),
        rateLimitWindow: parseInt(process.env.SECURITY_RATE_LIMIT_WINDOW || '900000'),
        maxRequestsPerWindow: parseInt(process.env.SECURITY_RATE_LIMIT_MAX_REQUESTS || '100'),
        strictRateLimit: parseInt(process.env.SECURITY_STRICT_RATE_LIMIT_MAX || '10'),
      },
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve security metrics',
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
