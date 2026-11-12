import { isIP } from 'node:net';
import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';

// Single source of truth for the enforced CSP. Origins are limited to what the
// Worker renders: Sentry ingest (connect), Turnstile (script/connect/frame),
// YouTube embeds, and the canonical site iframe. 'unsafe-inline' stays until
// inline scripts can be served with hashes.
export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://*.ingest.sentry.io https://sentry.io https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://piyushmehta.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;";

export function securityHeaders(hashes: readonly string[] = []): Record<string, string> {
  return {
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
    'Content-Security-Policy-Report-Only': `default-src 'self'; script-src 'self' ${hashes.join(' ')} https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io; frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; report-uri /api/csp-report; report-to csp;`,
    'Reporting-Endpoints': 'csp="/api/csp-report"',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  };
}

export const SECURITY_HEADERS = securityHeaders();

export async function hashInlineScripts(html: string): Promise<string[]> {
  const scripts: string[] = [];
  visit(fromHtml(html), 'element', (node) => {
    if (
      node.tagName !== 'script' ||
      node.properties.src ||
      !['', 'module', 'text/javascript', 'application/javascript'].includes(
        String(node.properties.type ?? '').toLowerCase(),
      )
    )
      return;
    scripts.push(node.children.map((child) => (child.type === 'text' ? child.value : '')).join(''));
  });
  return [
    ...new Set(
      await Promise.all(
        scripts.map(async (script) => {
          const bytes = new Uint8Array(
            await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script)),
          );
          return `'sha256-${btoa(String.fromCharCode(...bytes))}'`;
        }),
      ),
    ),
  ].sort();
}

export function json(data: unknown, status = 200, headers: Readonly<Record<string, string>> = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

/** Accept only server-provided addresses, never a browser's forwarding chain. */
export function getClientIp(request: Request, clientAddress?: string): string {
  const ip = request.headers.get('cf-connecting-ip') || clientAddress || '';
  return isIP(ip) ? ip : '';
}

/** Group IPv6 privacy addresses by /64 without collapsing IPv4-mapped clients. */
export function getRateLimitKey(ip: string): string {
  if (isIP(ip) !== 6) return ip;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [left, right] = canonical.split('::');
  const head = left ? left.split(':') : [];
  const tail = right ? right.split(':') : [];
  const words =
    right === undefined
      ? head
      : [...head, ...Array<string>(8 - head.length - tail.length).fill('0'), ...tail];
  if (words.slice(0, 5).every((word) => word === '0') && words[5] === 'ffff') {
    const value = Number.parseInt(words[6] + words[7].padStart(4, '0'), 16);
    return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
  }
  return `${words.slice(0, 4).join(':')}::/64`;
}

const ALLOWED_FORM_ORIGINS = new Set([
  'https://piyushmehta.com',
  'http://localhost:4321',
  'http://localhost:3000',
]);

/** Reads at most `max` bytes, including bodies without Content-Length. */
export async function readLimitedText(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
      all.set(chunk, at);
      at += chunk.byteLength;
    }
    return new TextDecoder().decode(all);
  } finally {
    reader.releaseLock();
  }
}

function requestOrigin(request: Request): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (!referer) return '';
  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

export function isAllowedFormOrigin(request: Request): boolean {
  const origin = requestOrigin(request);
  if (ALLOWED_FORM_ORIGINS.has(origin)) return true;

  try {
    // Preview and local Worker hostnames are trusted only when the browser
    // origin matches the URL the request was actually sent to.
    return new URL(request.url).origin === origin;
  } catch {
    return false;
  }
}
