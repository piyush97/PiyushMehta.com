import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';

export const prerender = false;

/**
 * Runtime Turnstile site key for the article panel. Blog pages are prerendered and the key is
 * `@dynamic`, so it cannot be inlined at build time. A site key is public by design; the secret
 * key never leaves the Worker.
 */
export const GET: APIRoute = async () => {
  const siteKey = ENV.PUBLIC_TURNSTILE_SITE_KEY;
  const configured = Boolean(siteKey && ENV.TURNSTILE_SECRET_KEY && ENV.CHAT_SESSION_SECRET);
  return configured
    ? Response.json(
        { siteKey },
        {
          headers: { 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' },
        },
      )
    : Response.json(
        { error: 'Chat unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
};
