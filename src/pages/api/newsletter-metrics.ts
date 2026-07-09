/**
 * Newsletter subscription rate-limit status.
 * Returns current rate limit state for the requesting IP.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Metrics endpoint removed. Use @upstash/ratelimit analytics dashboard.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
