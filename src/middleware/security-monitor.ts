// Security monitoring middleware integrating IP reputation and threat detection
import type { APIContext, MiddlewareHandler } from 'astro';
import { ipReputationService } from '../utils/ip-reputation';

interface SecurityContext {
  ip: string;
  userAgent: string;
  reputation: number;
  threats: string[];
  blocked: boolean;
  reason?: string;
}

export const securityMonitorMiddleware: MiddlewareHandler = async (context, next) => {
  const startTime = Date.now();

  try {
    // Skip security monitoring for prerendered pages and static assets
    if (!context.request || context.url.pathname.startsWith('/_')) {
      return next();
    }

    // Extract client information with fallback for prerendered pages
    const ip = getClientIP(context);
    const userAgent = context.request?.headers.get('user-agent') || 'unknown';

    // Analyze IP reputation and threats
    const [reputation, threats] = await Promise.all([
      ipReputationService.getReputationScore(ip),
      ipReputationService.analyzeThreatIndicators(ip, userAgent),
    ]);

    // Create security context
    const securityContext: SecurityContext = {
      ip,
      userAgent,
      reputation: reputation.score,
      threats: reputation.categories,
      blocked: false,
    };

    // Check if request should be blocked
    if (await ipReputationService.shouldBlockIP(ip)) {
      securityContext.blocked = true;
      securityContext.reason = 'low-reputation';

      logSecurityEvent('IP_BLOCKED', securityContext);

      return new Response('Access Denied', {
        status: 403,
        headers: {
          'X-Security-Block': 'ip-reputation',
          'X-Block-Reason': reputation.categories.join(','),
        },
      });
    }

    // Check for bot traffic (non-malicious bots get rate limited more strictly)
    if (threats.isBot && !isLegitimateBot(userAgent)) {
      securityContext.threats.push('bot');
      logSecurityEvent('BOT_DETECTED', securityContext);
    }

    // Check for suspicious patterns
    if (threats.isTor || threats.isVPN || threats.isProxy) {
      securityContext.threats.push('anonymization');
      logSecurityEvent('ANONYMIZATION_DETECTED', securityContext);
    }

    // Add security context to locals for other middleware
    context.locals.security = securityContext;

    // Proceed with request
    const response = await next();

    // Log successful request with timing
    logSecurityEvent('REQUEST_COMPLETED', {
      ...securityContext,
      responseTime: Date.now() - startTime,
      status: response instanceof Response ? response.status : 200,
    });

    return response;
  } catch (error) {
    console.error('Security monitoring error:', error);

    // On error, allow request to proceed but log the issue
    logSecurityEvent('SECURITY_ERROR', {
      ip: getClientIP(context),
      userAgent: context.request?.headers.get('user-agent') || 'unknown',
      error: error instanceof Error ? error.message : 'unknown',
      reputation: 0,
      threats: ['error'],
      blocked: false,
    });

    return next();
  }
};

function getClientIP(context: APIContext): string {
  const request = context.request;

  // Try to get IP from headers first
  const forwardedFor = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedFor) return forwardedFor;

  const realIP = request?.headers.get('x-real-ip');
  if (realIP) return realIP;

  const cfConnectingIP = request?.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // Try to get client address, but handle prerender gracefully
  try {
    return context.clientAddress || 'unknown';
  } catch (error) {
    // Handle prerender error gracefully
    if (error.name === 'PrerenderClientAddressNotAvailable') {
      return 'prerendered';
    }
    return 'unknown';
  }
}

function isLegitimateBot(userAgent: string): boolean {
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /applebot/i,
    /whatsapp/i,
  ];

  return legitimateBots.some((pattern) => pattern.test(userAgent));
}

interface SecurityEvent {
  timestamp: string;
  event: string;
  ip: string;
  userAgent: string;
  reputation: number;
  threats: string[];
  blocked: boolean;
  reason?: string;
  responseTime?: number;
  status?: number;
  error?: string;
}

function logSecurityEvent(
  eventType: string,
  context: SecurityContext & { responseTime?: number; status?: number; error?: string }
): void {
  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    event: eventType,
    ip: context.ip,
    userAgent: context.userAgent,
    reputation: context.reputation,
    threats: context.threats,
    blocked: context.blocked,
    reason: context.reason,
    responseTime: context.responseTime,
    status: context.status,
    error: context.error,
  };

  // Console logging for development
  if (eventType === 'IP_BLOCKED' || eventType === 'SECURITY_ERROR') {
    console.warn(`Security Event: ${eventType}`, event);
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`Security Event: ${eventType}`, event);
  }

  // In production, you might want to:
  // 1. Send to monitoring service (Datadog, New Relic, etc.)
  // 2. Store in database for analysis
  // 3. Trigger alerts for critical events
  // 4. Send to SIEM systems
  // 5. Generate security reports

  // Example integration points:
  // await sendToMonitoring(event);
  // await storeSecurityEvent(event);
  // await checkAlertThresholds(event);
}

/**
 * Security dashboard endpoint helper
 */
export function getSecurityMetrics(): {
  totalRequests: number;
  blockedRequests: number;
  averageReputation: number;
  topThreats: string[];
} {
  // In production, this would aggregate data from your security database
  return {
    totalRequests: 0,
    blockedRequests: 0,
    averageReputation: 0.8,
    topThreats: [],
  };
}
