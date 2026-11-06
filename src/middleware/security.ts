/**
 * Security Headers Middleware
 *
 * Adds security headers to all HTML responses:
 * - Content-Security-Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

import type { MiddlewareHandler } from 'astro';
import securityText from '../../public/.well-known/security.txt?raw';

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src 'self' https://*.ingest.sentry.io https://*.googletagmanager.com https://*.google-analytics.com https://sentry.io; frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://www.youtube.com https://piyushmehta.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
};

/**
 * Astro middleware that adds security headers to HTML responses.
 */
export const onRequest: MiddlewareHandler = async ({ request, url }, next) => {
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  let response: Response;
  if (isRead && url.pathname === '/.well-known/security.txt') {
    response = new Response(request.method === 'HEAD' ? null : securityText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } else if (isRead && url.pathname === '/security.txt') {
    response = Response.redirect(new URL('/.well-known/security.txt', url), 301);
  } else {
    response = await next();
  }

  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

export default onRequest;
