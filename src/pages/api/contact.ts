import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';

export const prerender = false;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 1000) pruneExpired();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count += 1;
  return false;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // CSRF: only accept requests from our own origin (exact match to prevent startsWith bypass)
    const rawOrigin = request.headers.get('origin');
    const rawReferer = request.headers.get('referer');
    let requestOrigin = rawOrigin ?? '';
    if (!requestOrigin && rawReferer) {
      try {
        requestOrigin = new URL(rawReferer).origin;
      } catch {
        requestOrigin = '';
      }
    }
    const allowed = new Set([
      'https://piyushmehta.com',
      'http://localhost:4321',
      'http://localhost:3000',
    ]);
    if (!allowed.has(requestOrigin)) {
      return json({ error: 'Forbidden.' }, 403);
    }

    const ip = (() => {
      try {
        return clientAddress ?? 'unknown';
      } catch {
        return 'unknown';
      }
    })();

    if (isRateLimited(ip)) {
      return json({ error: 'Too many requests. Try again in an hour.' }, 429);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid request body.' }, 400);
    }

    const { name, email, subject, message } = (body ?? {}) as Record<string, unknown>;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof subject !== 'string' ||
      !subject.trim() ||
      typeof message !== 'string' ||
      message.trim().length < 10
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

    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Contact Form <${fromAddress}>`,
          to: [toAddress],
          reply_to: cleanEmail,
          subject: `[Portfolio] ${cleanSubject}`,
          text: [
            `From: ${cleanName} <${cleanEmail}>`,
            `Subject: ${cleanSubject}`,
            '',
            cleanMessage,
          ].join('\n'),
          html: `
            <p><strong>From:</strong> ${escapeHtml(cleanName)} &lt;${escapeHtml(cleanEmail)}&gt;</p>
            <p><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
            <hr />
            <p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>
          `,
        }),
      });
    } catch (err) {
      console.error('[contact] Resend request failed:', err);
      return json({ error: 'Failed to send. Try again or email directly.' }, 502);
    }

    if (!response.ok) {
      const body = await response.text();
      console.error('[contact] Resend error:', response.status, body.slice(0, 200));
      return json({ error: 'Failed to send. Try again or email directly.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[contact] unhandled:', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
