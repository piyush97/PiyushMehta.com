/**
 * Newsletter subscription API.
 * Wraps Resend Contacts API with rate limiting via @upstash/ratelimit.
 */
import * as Sentry from '@sentry/astro';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { APIRoute } from 'astro';

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

async function addToResend(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  if (!segmentId) throw new Error('RESEND_SEGMENT_ID is not set');

  const response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: segmentId }] }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body.slice(0, 200)}`);
  }
}

async function sendConfirmation(email: string): Promise<void> {
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
    await addToResend(email);

    // Welcome email (non-fatal if it fails)
    await sendConfirmation(email).catch((err) => {
      console.warn('Welcome email failed:', err);
    });

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
