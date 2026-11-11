import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import {
  buildConfirmEmail,
  hasUsableSecret,
  normalizeEmail,
  sendEmail,
  signToken,
} from '@/utils/subscribe';
import { isAllowedFormOrigin, json, readLimitedText } from '@/utils/request-security';
import { createRatelimit, getClientIp, limitOrUnavailable } from '@/utils/redis';
import { verifyTurnstile } from '@/utils/chat/session';

export const prerender = false;

const ratelimit = createRatelimit('ratelimit:subscribe', 3, '1 h');
const globalDay = createRatelimit('ratelimit:subscribe:global', 50, '1 d');
// Caps confirmation mail to one address, so rotating IPs cannot mail-bomb a third party.
const perEmailDay = createRatelimit('ratelimit:subscribe:email', 2, '1 d');
const MAX_BODY_BYTES = 4 * 1024;

export const POST: APIRoute = async ({ request, clientAddress }) => {
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

    const { email, website, token } = (body ?? {}) as Record<string, unknown>;
    if (typeof website === 'string' && website.trim()) return json({ ok: true });

    const ip = getClientIp(request, clientAddress);
    if (!ip) return json({ error: 'Client address required.' }, 400);
    const limitError = await limitOrUnavailable(ratelimit, ip);
    if (limitError) return limitError;

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) return json({ error: 'Enter a valid email address.' }, 422);

    const apiKey = ENV.RESEND_API_KEY;
    const signingSecret = ENV.NEWSLETTER_SIGNING_SECRET;
    const fromAddress = normalizeEmail(ENV.CONTACT_FROM_EMAIL);

    if (!apiKey || !fromAddress) {
      console.error('[subscribe] RESEND_API_KEY or CONTACT_FROM_EMAIL missing');
      return json({ error: 'Email service not configured.' }, 503);
    }
    if (!hasUsableSecret(signingSecret)) {
      console.error('[subscribe] NEWSLETTER_SIGNING_SECRET missing or too short');
      return json({ error: 'Subscription service unavailable.' }, 503);
    }

    if (!ENV.TURNSTILE_SECRET_KEY) return json({ error: 'Subscription service unavailable.' }, 503);
    if (
      typeof token !== 'string' ||
      !(await verifyTurnstile(
        ENV.TURNSTILE_SECRET_KEY,
        token,
        ip,
        new URL(request.url).hostname,
        fetch,
        'newsletter-signup',
      ))
    )
      return json({ error: 'Verification failed.' }, 403);
    const emailDigest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cleanEmail)),
    );
    const emailError = await limitOrUnavailable(
      perEmailDay,
      Array.from(emailDigest, (byte) => byte.toString(16).padStart(2, '0')).join(''),
    );
    // Same answer as a fresh signup, so the limit does not reveal earlier requests.
    if (emailError) {
      return emailError.status === 429
        ? json({ ok: true })
        : json({ error: 'Subscription service unavailable.' }, 503, { 'Retry-After': '30' });
    }

    const capError = await limitOrUnavailable(globalDay, 'all');
    if (capError)
      return json({ error: 'Subscription service unavailable.' }, 503, { 'Retry-After': '30' });

    const confirmToken = await signToken(signingSecret, 'confirm', cleanEmail);
    const confirmUrl = new URL('/api/subscribe/confirm', request.url);
    confirmUrl.searchParams.set('token', confirmToken);

    try {
      await sendEmail(
        apiKey,
        buildConfirmEmail({ fromAddress, email: cleanEmail, confirmUrl: confirmUrl.toString() }),
      );
    } catch (err) {
      captureException(new Error('Subscribe confirmation delivery failed.'));
      console.error(
        '[subscribe] Resend request failed:',
        err instanceof Error ? err.name : 'UnknownError',
      );
      return json({ error: 'Could not send the confirmation email. Try again later.' }, 502);
    }

    // Same answer whether or not the address is already subscribed.
    return json({ ok: true });
  } catch (err) {
    captureException(new Error('Subscribe request failed.'));
    console.error('[subscribe] unhandled:', err instanceof Error ? err.name : 'UnknownError');
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
