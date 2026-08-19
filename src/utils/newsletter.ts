/**
 * Newsletter utilities — extracted from src/pages/api/newsletter.ts
 * so they can be unit-tested independently of the Astro route handler.
 */

export async function addToResendAudience(
  email: string,
  apiKey: string,
  segmentId: string,
  _fetch: typeof fetch = fetch,
): Promise<void> {
  const response = await _fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body.slice(0, 200)}`);
  }
}

export async function sendConfirmationEmail(
  email: string,
  apiKey: string,
  fromAddress: string,
  _fetch: typeof fetch = fetch,
): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; max-width:600px; margin:0 auto; padding:32px 20px; background:#fafafa;">
  <div style="background:#fff; border-radius:12px; padding:32px; border:1px solid #e5e7eb;">
    <h1 style="font-size:24px; font-weight:700; margin:0 0 8px; color:#111;">You're in.</h1>
    <p style="font-size:16px; line-height:1.6; color:#374151; margin:0 0 20px;">
      Thanks for subscribing to my newsletter. One email when there's something worth
      saying — AI news, production lessons, and builds. No spam, no fluff.
    </p>
    <p style="font-size:16px; line-height:1.6; color:#374151; margin:0 0 20px;">
      If you want to read past posts while you wait, head over to
      <a href="https://piyushmehta.com/blog/" style="color:#059669; text-decoration:underline;">the blog</a>.
    </p>
    <div style="border-top:1px solid #e5e7eb; padding-top:16px; margin-top:24px;">
      <p style="font-size:14px; color:#9ca3af; margin:0;">
        You received this because you subscribed at piyushmehta.com.
        If this wasn't you, you can ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  const response = await _fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
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
    throw new Error(`Resend email error ${response.status}: ${body.slice(0, 200)}`);
  }
}
