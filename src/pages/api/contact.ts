import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
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
    // CSRF: only accept requests from our own origin
    const origin = request.headers.get('origin') ?? request.headers.get('referer') ?? '';
    const allowed = ['https://piyushmehta.com', 'http://localhost:4321', 'http://localhost:3000'];
    if (!allowed.some((o) => origin.startsWith(o))) {
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

    const apiKey = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
    const fromAddress =
      process.env.CONTACT_FROM_EMAIL ??
      import.meta.env.CONTACT_FROM_EMAIL ??
      'onboarding@resend.dev';
    const toAddress =
      process.env.CONTACT_TO_EMAIL ?? import.meta.env.CONTACT_TO_EMAIL ?? 'contact@piyushmehta.com';

    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY missing');
      return json({ error: 'Email service not configured.' }, 503);
    }

    const resend = new Resend(apiKey);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    let result: Awaited<ReturnType<typeof resend.emails.send>>;
    try {
      result = await resend.emails.send({
        from: `Contact Form <${fromAddress}>`,
        to: toAddress,
        replyTo: cleanEmail,
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
      });
    } catch (err) {
      console.error('[contact] resend.send threw:', err);
      return json({ error: 'Failed to send. Try again or email directly.' }, 502);
    }

    if (result.error) {
      console.error('[contact] resend error:', result.error);
      return json({ error: 'Failed to send. Try again or email directly.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[contact] unhandled:', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
};
