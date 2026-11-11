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
import { CONTENT_SECURITY_POLICY } from '../utils/request-security';

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
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

  // Only a real embed page may be framed; the 404 shell under this prefix keeps DENY.
  if (response.status === 200 && url.pathname.startsWith('/lab/embed/')) {
    newHeaders.delete('X-Frame-Options');
    for (const name of ['Content-Security-Policy', 'Content-Security-Policy-Report-Only']) {
      const csp = newHeaders.get(name);
      if (csp) newHeaders.set(name, csp.replace("frame-ancestors 'none'", 'frame-ancestors *'));
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

export default onRequest;
