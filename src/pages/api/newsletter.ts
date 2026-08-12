/**
 * Newsletter subscription API.
 * Wraps Resend Contacts API with rate limiting via @upstash/ratelimit.
 */
import * as Sentry from '@sentry/astro';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { APIRoute } from 'astro';
import { addToResendAudience, sendConfirmationEmail } from '@/utils/newsletter';

export const prerender = false;

// ponytail: single Upstash Redis-based rate limiter. No ioredis fallback, no
// in-memory Map, no DB fallback. The Upstash client is HTTP-based and works
// in serverless. Add multi-layer fallback only if this proves insufficient.
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:newsletter',
});

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
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
    // Rate limiting
    const { success: allowed } = await ratelimit.limit(clientIP);
    if (!allowed) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const bodyText = await request.text();
    if (!bodyText.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Request body is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let data: { email?: string };
    try {
      data = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data.email || typeof data.email !== 'string') {
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

    // Subscribe via Resend
    const apiKey = process.env.RESEND_API_KEY;
    const segmentId = process.env.RESEND_SEGMENT_ID;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    if (!segmentId) throw new Error('RESEND_SEGMENT_ID is not set');

    await addToResendAudience(email, apiKey, segmentId);

    // Welcome email (non-fatal if it fails)
    const fromAddress = process.env.RESEND_FROM;
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    Sentry.captureException(error, {
      tags: { endpoint: 'newsletter_subscribe', ip: clientIP },
    });
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to subscribe. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
