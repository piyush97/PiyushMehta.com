import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

// Simple in-memory rate limit: 5 submissions per IP per hour
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? 'unknown';

  if (isRateLimited(ip)) {
    return json({ error: 'Too many requests. Try again later.' }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { name, email, subject, message } = body as Record<string, unknown>;

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

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    return json({ error: 'Email service not configured.' }, 503);
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: 'Contact Form <contact@piyushmehta.com>',
    to: 'contact@piyushmehta.com',
    replyTo: email.trim(),
    subject: `[Contact] ${subject.trim()}`,
    text: [
      `From: ${name.trim()} <${email.trim()}>`,
      `Subject: ${subject.trim()}`,
      '',
      message.trim(),
    ].join('\n'),
    html: `
      <p><strong>From:</strong> ${name.trim()} &lt;${email.trim()}&gt;</p>
      <p><strong>Subject:</strong> ${subject.trim()}</p>
      <hr />
      <p style="white-space:pre-wrap">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    `,
  });

  if (error) {
    return json({ error: 'Failed to send message. Please try again.' }, 500);
  }

  return json({ ok: true });
};
