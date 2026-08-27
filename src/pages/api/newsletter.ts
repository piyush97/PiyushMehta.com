/**
 * Newsletter subscription API.
 * Wraps Resend Contacts API with rate limiting via @upstash/ratelimit.
 */
import * as Sentry from '@sentry/astro';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { addToResendAudience, sendConfirmationEmail } from '@/utils/newsletter';

export const prerender = false;

// Upstash's analytics submission is asynchronous. Keep it disabled here because
// Astro's route contract does not expose a waitUntil hook for that background work.
const redis =
  ENV.UPSTASH_REDIS_REST_URL && ENV.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: ENV.UPSTASH_REDIS_REST_URL,
        token: ENV.UPSTASH_REDIS_REST_TOKEN,
        signal: () => AbortSignal.timeout(2500),
        retry: {
          retries: 1,
          backoff: (retryCount) => retryCount * 50,
        },
      })
    : null;
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'ratelimit:newsletter',
    })
  : null;

function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): { valid: boolean; reason?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, reason: 'Invalid email format' };
  if (email.length > 254) return { valid: false, reason: 'Email too long' };
  return { valid: true };
}

export const POST: APIRoute = async ({ request }) => {
  const clientIP = getClientIP(request);

  try {
    if (!ratelimit) {
      return new Response(JSON.stringify({ error: 'Newsletter service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { success: allowed } = await ratelimit.limit(clientIP);
    if (!allowed) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const bodyText = await request.text();
    if (!bodyText.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Request body is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data || typeof data !== 'object' || !('email' in data) || typeof data.email !== 'string') {
      return new Response(JSON.stringify({ success: false, message: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const email = sanitizeEmail(data.email);
    const validation = validateEmail(email);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, message: validation.reason }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = ENV.RESEND_API_KEY;
    const segmentId = ENV.RESEND_SEGMENT_ID;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    if (!segmentId) throw new Error('RESEND_SEGMENT_ID is not set');

    await addToResendAudience(email, apiKey, segmentId);

    const fromAddress = ENV.RESEND_FROM;
    if (fromAddress) {
      await sendConfirmationEmail(email, apiKey, fromAddress).catch((err) => {
        console.warn('Welcome email failed:', err);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Almost there! Check your inbox to confirm your subscription.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    Sentry.captureException(error, {
      tags: { endpoint: 'newsletter_subscribe', ip: clientIP },
    });
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to subscribe. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
