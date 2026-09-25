/**
 * Newsletter subscription API.
 * Wraps Resend Contacts API with rate limiting via @upstash/ratelimit.
 */
import * as Sentry from '@sentry/astro';
import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { addToResendAudience, sendConfirmationEmail } from '@/utils/newsletter';
import { isAllowedFormOrigin } from '@/utils/request-security';
import { createRatelimit, getClientIp } from '@/utils/redis';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:newsletter', 5, '15 m');
const MAX_BODY_BYTES = 16 * 1024;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } as const;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const clientIP = getClientIp(request, clientAddress);

  try {
    if (!isAllowedFormOrigin(request)) {
      return json({ success: false, message: 'Forbidden.' }, 403);
    }

    if (!ratelimit) {
      return json({ error: 'Newsletter service unavailable' }, 503);
    }

    const { success: allowed } = await ratelimit.limit(clientIP);
    if (!allowed) {
      return json({ success: false, message: 'Too many requests. Please try again later.' }, 429);
    }

    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ success: false, message: 'Request body is too large' }, 413);
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return json({ success: false, message: 'Request body is too large' }, 413);
    }
    if (!bodyText.trim()) {
      return json({ success: false, message: 'Request body is empty' }, 400);
    }

    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return json({ success: false, message: 'Invalid JSON' }, 400);
    }

    if (!data || typeof data !== 'object' || !('email' in data) || typeof data.email !== 'string') {
      return json({ success: false, message: 'Email is required' }, 400);
    }

    if (!('consent' in data) || data.consent !== true) {
      return json({ success: false, message: 'Consent is required to subscribe.' }, 400);
    }

    if ('website' in data && typeof data.website === 'string' && data.website.trim()) {
      return json({ success: false, message: 'Unable to process subscription.' }, 400);
    }

    const email = sanitizeEmail(data.email);
    const validation = validateEmail(email);
    if (!validation.valid) {
      return json({ success: false, message: validation.reason }, 400);
    }

    const apiKey = ENV.RESEND_API_KEY;
    const segmentId = ENV.RESEND_SEGMENT_ID;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    if (!segmentId) throw new Error('RESEND_SEGMENT_ID is not set');

    await addToResendAudience(email, apiKey, segmentId);

    const fromAddress = ENV.RESEND_FROM;
    let welcomeEmailStatus: 'requested' | 'skipped' | 'failed' = 'skipped';
    if (fromAddress) {
      try {
        await sendConfirmationEmail(email, apiKey, fromAddress, fetch, ENV.RESEND_REPLY_TO);
        welcomeEmailStatus = 'requested';
      } catch (err) {
        welcomeEmailStatus = 'failed';
        console.warn('Welcome email failed:', err);
      }
    }

    return json(
      {
        success: true,
        message: 'Your subscription is recorded.',
        welcomeEmailStatus,
      },
      200,
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    Sentry.captureException(error, {
      tags: { endpoint: 'newsletter_subscribe' },
    });
    return json({ success: false, message: 'Failed to subscribe. Please try again later.' }, 500);
  }
};
