import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { createRatelimit, getClientIp } from '@/utils/redis';
import { sendContactEmail } from '@/utils/contact';
import { isAllowedFormOrigin } from '@/utils/request-security';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:contact', 5, '1 h');
const MAX_BODY_BYTES = 16 * 1024;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 5_000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // CSRF: only accept requests from an explicitly allowed site origin.
    if (!isAllowedFormOrigin(request)) {
      return json({ error: 'Forbidden.' }, 403);
    }

    // Fail closed: without a limiter this endpoint would send unbounded email.
    if (!ratelimit) {
      return json({ error: 'Contact service unavailable.' }, 503);
    }

    const { success } = await ratelimit.limit(getClientIp(request, clientAddress));
    if (!success) {
      return json({ error: 'Too many requests. Try again in an hour.' }, 429);
    }

    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ error: 'Request body is too large.' }, 413);
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return json({ error: 'Request body is too large.' }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return json({ error: 'Invalid request body.' }, 400);
    }

    const { name, email, subject, message } = (body ?? {}) as Record<string, unknown>;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > MAX_NAME_LENGTH ||
      typeof email !== 'string' ||
      email.length > MAX_EMAIL_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof subject !== 'string' ||
      !subject.trim() ||
      subject.trim().length > MAX_SUBJECT_LENGTH ||
      typeof message !== 'string' ||
      message.trim().length < 10 ||
      message.trim().length > MAX_MESSAGE_LENGTH
    ) {
      return json({ error: 'All fields are required and must be valid.' }, 422);
    }

    const apiKey = ENV.RESEND_API_KEY;
    const fromAddress = ENV.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';
    const toAddress = ENV.CONTACT_TO_EMAIL || 'contact@piyushmehta.com';

    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY missing');
      return json({ error: 'Email service not configured.' }, 503);
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    try {
      await sendContactEmail({
        apiKey,
        fromAddress,
        toAddress,
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      });
    } catch (err) {
      console.error('[contact] Resend request failed:', err);
      return json({ error: 'Failed to send. Try again or email directly.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[contact] unhandled:', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
