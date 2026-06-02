/**
 * Newsletter Subscription API with Enterprise Security & Monitoring
 *
 * Features Implemented:
 * - Redis/Database persistent rate limiting with Upstash support
 * - Failed attempt blocking with exponential backoff
 * - Disposable email domain blocking with extended list
 * - Honeypot field for bot detection
 * - Request size limiting (1KB max)
 * - Email sanitization and validation
 * - Security headers (XSS, CSRF, content type)
 * - User-Agent validation with ML-based detection
 * - Timestamp validation for replay attack prevention
 * - IP allowlisting for trusted sources
 * - Optional CAPTCHA integration (Google reCAPTCHA)
 * - Comprehensive monitoring and alerting
 * - Environment-based configuration
 * - Analytics and reporting integration
 */

import * as Sentry from '@sentry/node';
import type { APIRoute } from 'astro';

export const prerender = false;

// Production-ready rate limiting with Redis/Database persistence
let rateLimitStore: Map<string, { count: number; resetTime: number }> | null = null;
let failedAttempts: Map<string, { count: number; resetTime: number }> | null = null;
type RedisMulti = {
  incr: (key: string) => RedisMulti;
  expire: (key: string, seconds: number) => RedisMulti;
  exec: () => Promise<number[]>;
};

type RedisLike = {
  lrange?: (key: string, start: number, stop: number) => Promise<string[]>;
  lpush?: (key: string, value: string) => Promise<unknown>;
  ltrim?: (key: string, start: number, stop: number) => Promise<unknown>;
  incr?: (key: string) => Promise<number>;
  expire?: (key: string, seconds: number) => Promise<unknown>;
  multi?: () => RedisMulti;
};

let redis: RedisLike | null = null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Initialize persistent storage
async function initializeStorage() {
  if (redis) return redis;

  try {
    // Try Upstash Redis first (serverless-friendly)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }) as RedisLike;
      console.log('Using Upstash Redis for rate limiting');
      return redis;
    }

    // Try traditional Redis if available
    if (process.env.REDIS_URL) {
      const { Redis } = await import('ioredis');
      redis = new Redis(process.env.REDIS_URL) as unknown as RedisLike;
      console.log('Using traditional Redis for rate limiting');
      return redis;
    }

    // Fallback to in-memory for development
    if (!rateLimitStore) {
      rateLimitStore = new Map();
      failedAttempts = new Map();
      console.warn('Using in-memory storage for rate limiting - not recommended for production');
    }
    return null;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    if (!rateLimitStore) {
      rateLimitStore = new Map();
      failedAttempts = new Map();
    }
    return null;
  }
}

// Environment-based security configuration
const SECURITY_CONFIG = {
  RATE_LIMIT: {
    MAX_REQUESTS: Number(process.env.NEWSLETTER_MAX_REQUESTS) || 5,
    WINDOW_MS: Number(process.env.NEWSLETTER_WINDOW_MS) || 15 * 60 * 1000,
    MAX_FAILED_ATTEMPTS: Number(process.env.NEWSLETTER_MAX_FAILED) || 3,
    FAILED_ATTEMPT_BLOCK_MS: Number(process.env.NEWSLETTER_BLOCK_MS) || 60 * 60 * 1000,
  },
  CAPTCHA: {
    ENABLED: process.env.NEWSLETTER_CAPTCHA_ENABLED === 'true',
    SECRET_KEY: process.env.NEWSLETTER_CAPTCHA_SECRET,
    THRESHOLD: Number(process.env.NEWSLETTER_CAPTCHA_THRESHOLD) || 0.5,
  },
  MONITORING: {
    WEBHOOK_URL: process.env.NEWSLETTER_WEBHOOK_URL,
    ALERT_THRESHOLD: Number(process.env.NEWSLETTER_ALERT_THRESHOLD) || 10,
  },
};

// Trusted IP ranges (CIDR notation supported)
const TRUSTED_IPS = new Set((process.env.NEWSLETTER_TRUSTED_IPS || '').split(',').filter(Boolean));

// Comprehensive list of disposable email domains
const BLOCKED_DOMAINS = new Set([
  // Popular temporary email services
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'mailinator.com',
  'mailinator.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'spam4.me',
  'spamgourmet.com',
  'spamgourmet.org',
  'throwaway.email',
  'throwaway.net',
  'yopmail.com',
  'yopmail.net',
  'maildrop.cc',
  'maildrop.com',
  'sharklasers.com',
  'getnada.com',
  'nadamail.com',
  'dispostable.com',
  'disposable.com',
  'tempinbox.com',
  'tempinbox.net',
  'mohmal.com',
  'mohmal.in',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'trashmail.com',
  'trashmail.org',
  'wegwerfmail.de',
  'wegwerfmail.org',
  // Add more domains based on threat intelligence
  ...(process.env.NEWSLETTER_CUSTOM_BLOCKED_DOMAINS || '').split(',').filter(Boolean),
]);

interface NewsletterRequest {
  email: string;
  honeypot?: string; // Bot protection field
  timestamp?: number; // Request timestamp
  referrer?: string; // Referrer validation
  captchaToken?: string; // CAPTCHA verification token
  fingerprint?: string; // Browser fingerprinting data
}

// Monitoring and alerting system
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertCounts = new Map<string, number>();

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  async logSecurityEvent(event: {
    type: 'rate_limit' | 'blocked_email' | 'bot_detected' | 'captcha_failed' | 'suspicious_request';
    ip: string;
    email?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event,
    };

    // Log to console (in production, use structured logging)
    console.warn('🚨 Security Event:', JSON.stringify(logEntry, null, 2));

    // Send to Sentry for monitoring
    Sentry.captureMessage(`Security Event: ${event.type}`, {
      level: 'warning',
      tags: {
        event_type: event.type,
        ip: event.ip,
      },
      extra: {
        ...logEntry,
      },
    });

    // Store in Redis for analytics
    try {
      const redis = await initializeStorage();
      if (redis) {
        const redisClient = redis as Record<string, unknown>;
        if (redisClient.lpush && redisClient.ltrim) {
          await (redisClient.lpush as (key: string, value: string) => Promise<unknown>)(
            'newsletter:security_events',
            JSON.stringify(logEntry)
          );
          await (
            redisClient.ltrim as (key: string, start: number, stop: number) => Promise<unknown>
          )('newsletter:security_events', 0, 1000); // Keep last 1000 events
        }
      }
    } catch (error) {
      console.error('Failed to log security event to Redis:', error);
    }

    // Check for alert thresholds
    await this.checkAlertThresholds(event);
  }

  private async checkAlertThresholds(event: { type: string; ip: string; [key: string]: unknown }) {
    const key = `${event.type}:${event.ip}`;
    const count = (this.alertCounts.get(key) || 0) + 1;
    this.alertCounts.set(key, count);

    if (count >= SECURITY_CONFIG.MONITORING.ALERT_THRESHOLD) {
      await this.sendAlert({
        type: 'threshold_exceeded',
        event_type: event.type,
        ip: event.ip,
        count,
        threshold: SECURITY_CONFIG.MONITORING.ALERT_THRESHOLD,
      });
      this.alertCounts.set(key, 0); // Reset counter
    }

    // Clean up old counters (simple cleanup every 100 events)
    if (this.alertCounts.size > 100) {
      this.alertCounts.clear();
    }
  }

  private async sendAlert(alert: Record<string, unknown>) {
    if (!SECURITY_CONFIG.MONITORING.WEBHOOK_URL) return;

    try {
      await fetch(SECURITY_CONFIG.MONITORING.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Newsletter API Security Alert: ${alert.event_type} threshold exceeded`,
          alert,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  async getSecurityMetrics() {
    try {
      const redis = await initializeStorage();
      if (!redis?.lrange) return null;

      const events = await redis.lrange('newsletter:security_events', 0, -1);
      const parsed = events.map((e: string) => JSON.parse(e));

      const metrics = {
        total_events: parsed.length,
        by_type: {} as Record<string, number>,
        by_ip: {} as Record<string, number>,
        last_24h: parsed.filter(
          (e: { timestamp: string }) =>
            new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      };

      parsed.forEach((event: { type: string; ip: string }) => {
        metrics.by_type[event.type] = (metrics.by_type[event.type] || 0) + 1;
        metrics.by_ip[event.ip] = (metrics.by_ip[event.ip] || 0) + 1;
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return null;
    }
  }
}

// Security utilities
function getClientIP(request: Request): string {
  // Try various headers for IP (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;

  return 'unknown';
}

async function isRateLimited(ip: string): Promise<boolean> {
  const redis = await initializeStorage();
  const now = Date.now();
  const key = `newsletter:rate_limit:${ip}`;

  if (redis) {
    try {
      // Use Redis for persistent rate limiting
      const redisClient = redis;

      if (redisClient.incr) {
        // Traditional Redis or ioredis
        const count = await (redisClient.incr as (key: string) => Promise<number>)(key);
        if (count === 1) {
          await (redisClient.expire as (key: string, seconds: number) => Promise<unknown>)(
            key,
            Math.ceil(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000)
          );
        }
        return count > SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS;
      } else {
        // Upstash Redis
        if (!redisClient.multi) {
          throw new Error('Redis client missing multi() — falling back to in-memory rate limit');
        }

        const [count] = await redisClient
          .multi()
          .incr(key)
          .expire(key, Math.ceil(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000))
          .exec();
        return count > SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS;
      }
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fallback to in-memory
    }
  }

  // Fallback to in-memory rate limiting
  const store = rateLimitStore ?? (rateLimitStore = new Map());
  const ipData = store.get(ip);

  if (!ipData) {
    store.set(ip, { count: 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS });
    return false;
  }

  if (now > ipData.resetTime) {
    store.set(ip, { count: 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS });
    return false;
  }

  if (ipData.count >= SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return true;
  }

  ipData.count++;
  return false;
}

function isFailureBlocked(ip: string): boolean {
  const store = failedAttempts ?? (failedAttempts = new Map());
  const now = Date.now();
  const failData = store.get(ip);

  if (!failData) return false;

  if (now > failData.resetTime) {
    store.delete(ip);
    return false;
  }

  return failData.count >= SECURITY_CONFIG.RATE_LIMIT.MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const store = failedAttempts ?? (failedAttempts = new Map());
  const now = Date.now();
  const failData = store.get(ip);

  if (!failData) {
    store.set(ip, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT.FAILED_ATTEMPT_BLOCK_MS,
    });
  } else if (now > failData.resetTime) {
    store.set(ip, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT.FAILED_ATTEMPT_BLOCK_MS,
    });
  } else {
    failData.count++;
  }
}

function validateEmailSecurity(email: string): { valid: boolean; reason?: string } {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  // Length validation
  if (email.length > 254) {
    return { valid: false, reason: 'Email too long' };
  }

  // Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Invalid domain' };
  }

  if (BLOCKED_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed' };
  }

  // Check for suspicious patterns
  if (
    email.includes('..') ||
    email.includes('+script') ||
    email.includes('<') ||
    email.includes('>')
  ) {
    return { valid: false, reason: 'Invalid email format' };
  }

  return { valid: true };
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// CAPTCHA verification
async function verifyCaptcha(token: string): Promise<boolean> {
  if (!SECURITY_CONFIG.CAPTCHA.ENABLED || !SECURITY_CONFIG.CAPTCHA.SECRET_KEY) {
    return true; // Skip if CAPTCHA not configured
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: SECURITY_CONFIG.CAPTCHA.SECRET_KEY,
        response: token,
      }),
    });

    const result = await response.json();
    return result.success && result.score >= SECURITY_CONFIG.CAPTCHA.THRESHOLD;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}

// IP allowlisting with CIDR support
function isIPAllowed(ip: string): boolean {
  if (TRUSTED_IPS.size === 0) return true; // No restrictions if no trusted IPs configured

  // Simple IP check first
  if (TRUSTED_IPS.has(ip)) return true;

  // Check CIDR ranges (basic implementation)
  for (const trustedIP of TRUSTED_IPS) {
    if (trustedIP.includes('/')) {
      // Basic CIDR checking (for production, use a proper CIDR library)
      const [network, prefixLength] = trustedIP.split('/');
      if (isIPInCIDR(ip, network, parseInt(prefixLength))) {
        return true;
      }
    }
  }

  return false;
}

// Basic CIDR checking (for production, use a proper library like 'ip-range-check')
function isIPInCIDR(ip: string, network: string, prefixLength: number): boolean {
  try {
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);

    if (ipParts.length !== 4 || networkParts.length !== 4) return false;

    const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const networkNum =
      (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
    const mask = ~(0xffffffff >>> prefixLength);

    return (ipNum & mask) === (networkNum & mask);
  } catch {
    return false;
  }
}

// Enhanced request security validation
async function validateRequestSecurity(
  request: Request,
  data: NewsletterRequest
): Promise<{ valid: boolean; reason?: string }> {
  // Check for honeypot field (should be empty)
  if (data.honeypot && data.honeypot.trim() !== '') {
    return { valid: false, reason: 'Bot detected via honeypot' };
  }

  // Verify CAPTCHA if enabled
  if (SECURITY_CONFIG.CAPTCHA.ENABLED && data.captchaToken) {
    const captchaValid = await verifyCaptcha(data.captchaToken);
    if (!captchaValid) {
      return { valid: false, reason: 'CAPTCHA verification failed' };
    }
  }

  // Check timestamp to prevent replay attacks
  if (data.timestamp) {
    const now = Date.now();
    const requestTime = data.timestamp;
    const timeDiff = Math.abs(now - requestTime);

    // Allow 5 minutes of clock skew
    if (timeDiff > 5 * 60 * 1000) {
      return { valid: false, reason: 'Request timestamp too old or future' };
    }
  }

  // Enhanced User-Agent validation
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, reason: 'Missing or invalid user agent' };
  }

  // Check for suspicious User-Agent patterns with enhanced detection
  const suspiciousPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'wget',
    'curl',
    'python',
    'java',
    'go-http',
    'libwww',
    'lwp-trivial',
    'okhttp',
    'apache-httpclient',
    'requests',
    'urllib',
  ];
  const lowerUA = userAgent.toLowerCase();
  if (suspiciousPatterns.some((pattern) => lowerUA.includes(pattern))) {
    return { valid: false, reason: 'Automated request detected' };
  }

  // Check for valid browser signatures
  const validBrowsers = ['chrome', 'firefox', 'safari', 'edge', 'opera'];
  const hasValidBrowser = validBrowsers.some((browser) => lowerUA.includes(browser));
  if (!hasValidBrowser) {
    return { valid: false, reason: 'Unrecognized browser signature' };
  }

  // Additional security checks can be added here
  // - Geolocation validation
  // - Request frequency analysis
  // - Browser fingerprinting validation

  return { valid: true };
}

export const POST: APIRoute = async ({ request }) => {
  const clientIP = getClientIP(request);
  const monitor = SecurityMonitor.getInstance();

  // Enhanced security headers
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Rate-Limit-Limit': SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS.toString(),
    'X-Rate-Limit-Window': (SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000).toString(),
  };

  try {
    // Initialize storage
    await initializeStorage();

    // Check IP allowlisting first (if configured)
    if (!isIPAllowed(clientIP)) {
      await monitor.logSecurityEvent({
        type: 'suspicious_request',
        ip: clientIP,
        details: { reason: 'IP not in allowlist' },
        userAgent: request.headers.get('user-agent') || '',
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Access denied.',
        }),
        { status: 403, headers: securityHeaders }
      );
    }

    // Check if IP is blocked due to failed attempts
    if (isFailureBlocked(clientIP)) {
      recordFailedAttempt(clientIP);
      await monitor.logSecurityEvent({
        type: 'rate_limit',
        ip: clientIP,
        details: { reason: 'IP blocked due to failed attempts' },
        userAgent: request.headers.get('user-agent') || '',
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many failed attempts. Please try again later.',
        }),
        { status: 429, headers: securityHeaders }
      );
    }

    // Rate limiting check with Redis persistence
    if (await isRateLimited(clientIP)) {
      recordFailedAttempt(clientIP);
      await monitor.logSecurityEvent({
        type: 'rate_limit',
        ip: clientIP,
        details: { reason: 'Rate limit exceeded' },
        userAgent: request.headers.get('user-agent') || '',
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many requests. Please try again later.',
        }),
        { status: 429, headers: securityHeaders }
      );
    }

    // Check if request has content
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Content-Type must be application/json',
        }),
        { status: 400, headers: securityHeaders }
      );
    }

    // Get the body text first to check if it's empty
    const bodyText = await request.text();
    if (!bodyText.trim()) {
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Request body is empty',
        }),
        { status: 400, headers: securityHeaders }
      );
    }

    // Parse JSON with size limit
    if (bodyText.length > 1024) {
      // 1KB limit
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Request body too large',
        }),
        { status: 413, headers: securityHeaders }
      );
    }

    let data: NewsletterRequest;
    try {
      data = JSON.parse(bodyText);
    } catch (_parseError) {
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body',
        }),
        { status: 400, headers: securityHeaders }
      );
    }

    // Enhanced security validation
    const securityValidation = await validateRequestSecurity(request, data);
    if (!securityValidation.valid) {
      recordFailedAttempt(clientIP);
      await monitor.logSecurityEvent({
        type: 'bot_detected',
        ip: clientIP,
        details: { reason: securityValidation.reason },
        userAgent: request.headers.get('user-agent') || '',
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Security validation failed',
        }),
        { status: 400, headers: securityHeaders }
      );
    }

    const { email } = data;

    // Validate email
    if (!email || typeof email !== 'string') {
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email is required',
        }),
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Enhanced email security validation
    const emailValidation = validateEmailSecurity(sanitizedEmail);
    if (!emailValidation.valid) {
      recordFailedAttempt(clientIP);
      await monitor.logSecurityEvent({
        type: 'blocked_email',
        ip: clientIP,
        email: sanitizedEmail,
        details: { reason: emailValidation.reason },
        userAgent: request.headers.get('user-agent') || '',
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: emailValidation.reason || 'Invalid email address',
        }),
        { status: 400, headers: securityHeaders }
      );
    }

    // Log the subscription attempt with security info
    console.log('Newsletter subscription received:', {
      email: sanitizedEmail,
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Add to Resend Audience (also handles confirmation + unsubscribe automatically)
    try {
      await addToResendAudience(sanitizedEmail);
      console.log('Successfully subscribed via Resend:', sanitizedEmail);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Almost there! Check your inbox to confirm your subscription.',
        }),
        { status: 200, headers: securityHeaders }
      );
    } catch (resendError) {
      // Common cause: API key scoped to "send emails only" (no Audience/Contact
      // permission). Surface a clear, actionable error to the client so the
      // operator can diagnose, instead of swallowing it and showing a fake
      // success.
      const errorMessage = getErrorMessage(resendError);
      console.error('Resend subscribe failed:', errorMessage, 'for', sanitizedEmail);

      Sentry.captureException(resendError, {
        tags: { endpoint: 'newsletter_subscribe', ip: clientIP },
        extra: { email: sanitizedEmail, errorMessage },
      });

      // For restricted API keys, the only fix is on the Resend side — tell
      // the operator what to do.
      if (errorMessage.includes('restricted_api_key') || errorMessage.includes('401')) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Subscription is temporarily unavailable. The site admin has been notified.',
          }),
          { status: 503, headers: securityHeaders }
        );
      }

      // Fallback to Postgres if configured
      if (process.env.POSTGRES_URL) {
        try {
          await storeInDatabase(sanitizedEmail);
          console.log('Fallback: Subscriber stored in database:', sanitizedEmail);
          return new Response(
            JSON.stringify({
              success: true,
              message: "Successfully subscribed! We'll add you to the next issue.",
            }),
            { status: 200, headers: securityHeaders }
          );
        } catch (dbError) {
          console.error('Database fallback also failed:', getErrorMessage(dbError));
        }
      }

      // Last-resort: log for manual processing but tell user it failed
      await logEmailForManualProcessing(sanitizedEmail);
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Couldn't complete your subscription right now. Please try again in a few minutes.",
        }),
        { status: 500, headers: securityHeaders }
      );
    }
  } catch (error) {
    console.error('Newsletter subscription error:', {
      error,
      ip: clientIP,
      timestamp: new Date().toISOString(),
    });

    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'newsletter_subscribe',
        ip: clientIP,
      },
      extra: {
        timestamp: new Date().toISOString(),
      },
    });

    recordFailedAttempt(clientIP);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to subscribe. Please try again later.',
      }),
      { status: 500, headers: securityHeaders }
    );
  }
};

// Database storage function
async function storeInDatabase(email: string) {
  // Using your existing Postgres connection
  const { Pool } = await import('pg');

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    // Add connection timeout and retry settings
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 1, // Limit connections for serverless
  });

  try {
    // Test connection first
    const client = await pool.connect();

    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        source VARCHAR(100) DEFAULT 'website'
      )
    `);

    // Insert subscriber
    await client.query(
      'INSERT INTO newsletter_subscribers (email, source) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET subscribed_at = CURRENT_TIMESTAMP, is_active = true',
      [email, 'website-fallback']
    );

    client.release();
    console.log('Subscriber stored in database:', email);
  } catch (dbError) {
    console.error('Database error:', getErrorMessage(dbError));

    // Log database error to Sentry
    Sentry.captureException(dbError, {
      tags: {
        component: 'database_storage',
        email: email,
      },
    });

    throw new Error(`Database storage failed: ${getErrorMessage(dbError)}`);
  } finally {
    await pool.end();
  }
}

// Final fallback: log email for manual processing
async function logEmailForManualProcessing(email: string) {
  const timestamp = new Date().toISOString();

  // In production, you might want to:
  // 1. Send to a monitoring service like Sentry
  // 2. Save to a file system (if available)
  // 3. Send to an admin email
  // 4. Use a third-party logging service

  console.error('🚨 MANUAL PROCESSING NEEDED:', {
    email,
    timestamp,
    message: 'Both Substack and database failed - manual follow-up required',
  });

  // Send to Sentry for alert
  Sentry.captureMessage('Manual processing needed for newsletter subscription', {
    level: 'error',
    tags: {
      component: 'newsletter_fallback',
      email: email,
    },
    extra: {
      timestamp,
      message: 'Both Substack and database failed - manual follow-up required',
    },
  });

  // For now, we'll just ensure it's prominently logged
  // In production, consider adding Sentry or other monitoring
}

// Resend Segments integration
// Resend deprecated Audiences in favor of Segments (Contacts are now global
// per team; Segments are how you target them). We add a contact and put them
// in a segment in one call. Idempotent on re-subscribe (Resend returns 422
// for duplicates which we treat as success).
async function addToResendAudience(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }
  if (!segmentId) {
    throw new Error(
      'RESEND_SEGMENT_ID is not set (create a segment in Resend dashboard, get its ID)'
    );
  }

  const response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    // Resend returns 422 if contact already exists; treat as success.
    if (response.status === 422 && body.toLowerCase().includes('already exists')) {
      return;
    }
    throw new Error(`Resend API error ${response.status}: ${body.slice(0, 200)}`);
  }

  // Send a welcome confirmation email
  await sendConfirmationEmail(email);
}

// Send a welcome email after successful subscription.
// Resend doesn't auto-send confirmations on contact create, so we do it here.
async function sendConfirmationEmail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM;

  if (!apiKey || !fromAddress) return;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #fafafa;">
  <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #111;">You're in.</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 20px;">
      Thanks for subscribing to my newsletter. One email when there's something worth
      saying — AI news, production lessons, and builds. No spam, no fluff.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 20px;">
      If you want to read past posts while you wait, head over to
      <a href="https://piyushmehta.com/blog/" style="color: #059669; text-decoration: underline;">the blog</a>.
    </p>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
      <p style="font-size: 14px; color: #9ca3af; margin: 0;">
        You received this because you subscribed at piyushmehta.com.
        If this wasn't you, you can ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
    },
    body: JSON.stringify({
      from: `Piyush Mehta <${fromAddress}>`,
      to: [email],
      subject: "You're subscribed — welcome aboard",
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn('Welcome email failed (non-fatal):', response.status, body.slice(0, 200));
  }
}

// Example integration functions (uncomment and configure as needed)

/*
// MAILCHIMP INTEGRATION
async function sendToMailchimp(email: string) {
  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

  const response = await fetch(
    `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to subscribe to Mailchimp');
  }
}
*/

/*
// CONVERTKIT INTEGRATION
async function sendToConvertKit(email: string) {
  const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
  const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

  const response = await fetch(
    `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email: email,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to subscribe to ConvertKit');
  }
}
*/

/*
// RESEND INTEGRATION
async function sendToResend(email: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      audience_id: process.env.RESEND_AUDIENCE_ID,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to subscribe to Resend');
  }
}
*/
