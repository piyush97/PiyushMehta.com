import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import { sendContactEmail, MAX_NAME, MAX_EMAIL, MAX_SUBJECT, MAX_MESSAGE } from '@/utils/contact';
import { isAllowedFormOrigin, json, readLimitedText } from '@/utils/request-security';
import { recordConversion, runInBackground } from '@/utils/conversions';
import { createRatelimit, getClientIp, limitOrUnavailable, reactionRedis } from '@/utils/redis';
import { verifyTurnstile } from '@/utils/chat/session';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:contact', 5, '1 h');
const globalDay = createRatelimit('ratelimit:contact:global', 30, '1 d');
const MAX_BODY_BYTES = 16 * 1024;

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  try {
    // CSRF: only accept requests from an explicitly allowed site origin.
    if (!isAllowedFormOrigin(request)) {
      return json({ error: 'Forbidden.' }, 403);
    }

    if (
      request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
    ) {
      return json({ error: 'Content-Type must be application/json.' }, 415);
    }

    const bodyText = await readLimitedText(request, MAX_BODY_BYTES);
    if (bodyText === null) {
      return json({ error: 'Request body is too large.' }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return json({ error: 'Invalid request body.' }, 400);
    }

    const { name, email, subject, message, website, token } = (body ?? {}) as Record<
      string,
      unknown
    >;
    if (typeof website === 'string' && website.trim()) return json({ ok: true });

    const ip = getClientIp(request, clientAddress);
    if (!ip) return json({ error: 'Client address required.' }, 400);
    const limitError = await limitOrUnavailable(ratelimit, ip);
    if (limitError) return limitError;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > MAX_NAME ||
      typeof email !== 'string' ||
      email.length > MAX_EMAIL ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof subject !== 'string' ||
      !subject.trim() ||
      subject.trim().length > MAX_SUBJECT ||
      typeof message !== 'string' ||
      message.trim().length < 10 ||
      message.trim().length > MAX_MESSAGE
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

    if (!ENV.TURNSTILE_SECRET_KEY) return json({ error: 'Contact service unavailable.' }, 503);
    if (
      typeof token !== 'string' ||
      !(await verifyTurnstile(
        ENV.TURNSTILE_SECRET_KEY,
        token,
        ip,
        new URL(request.url).hostname,
        fetch,
        'contact-form',
      ))
    )
      return json({ error: 'Verification failed.' }, 403);
    const capError = await limitOrUnavailable(globalDay, 'all');
    if (capError)
      return json({ error: 'Contact service unavailable.' }, 503, { 'Retry-After': '30' });

    const cleanName = name.replace(/[\r\n]+/g, ' ').trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.replace(/[\r\n]+/g, ' ').trim();
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
      captureException(new Error('Contact delivery failed.'));
      console.error(
        '[contact] Resend request failed:',
        err instanceof Error ? err.name : 'UnknownError',
      );
      return json({ error: 'Failed to send. Try again or email directly.' }, 502);
    }

    runInBackground(locals, recordConversion(reactionRedis, 'contact_sent'));
    return json({ ok: true });
  } catch (err) {
    captureException(new Error('Contact request failed.'));
    console.error('[contact] unhandled:', err instanceof Error ? err.name : 'UnknownError');
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
