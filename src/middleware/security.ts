import type { MiddlewareHandler } from 'astro';
import securityText from '../../public/.well-known/security.txt?raw';
import { SECURITY_HEADERS, hashInlineScripts, securityHeaders } from '../utils/request-security';

export { SECURITY_HEADERS } from '../utils/request-security';

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
  const headers =
    !newHeaders.has('Content-Security-Policy-Report-Only') &&
    newHeaders.get('content-type')?.includes('text/html')
      ? securityHeaders(await hashInlineScripts(await response.clone().text()))
      : SECURITY_HEADERS;
  for (const [key, value] of Object.entries(headers)) {
    if (!newHeaders.has(key)) newHeaders.set(key, value);
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
