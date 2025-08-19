// Enhanced Security middleware with enterprise-grade protection
import type { MiddlewareHandler } from 'astro';
import { generateNonce, getCertificateTransparencyHeaders } from '../utils/security-utils';

export const securityHeaders: MiddlewareHandler = async (context, next) => {
  // Generate cryptographic nonce for scripts
  const nonce = generateNonce();

  // Add nonce to context for use in components
  context.locals.nonce = nonce;

  const response = await next();

  if (response instanceof Response) {
    // Enhanced Content Security Policy with nonce-based execution
    const isDevelopment = process.env.NODE_ENV === 'development';
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' giscus.app *.vercel-insights.com *.vercel-analytics.com${isDevelopment ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' fonts.gstatic.com data:",
      "connect-src 'self' *.vercel-insights.com *.vercel-analytics.com giscus.app wss://giscus.app",
      'frame-src giscus.app',
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "media-src 'self' data: blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspDirectives);

    // Enhanced security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Enhanced HSTS with preload
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );

    // Comprehensive Permissions Policy
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'fullscreen=(self)',
      'picture-in-picture=()',
      'screen-wake-lock=()',
      'web-share=(self)',
    ].join(', ');

    response.headers.set('Permissions-Policy', permissionsPolicy);

    // Cross-Origin policies
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    // Certificate Transparency monitoring (skip in development)
    if (process.env.NODE_ENV !== 'development') {
      const ctHeaders = await getCertificateTransparencyHeaders();
      if (ctHeaders) {
        Object.entries(ctHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
    }

    // Cache control for security-sensitive responses
    if (context.url.pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
    }
  }

  return response;
};
