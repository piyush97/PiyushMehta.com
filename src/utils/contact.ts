export interface ContactEmailInput {
  apiKey: string;
  fromAddress: string;
  toAddress: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendContactEmail(
  input: ContactEmailInput,
  _fetch: typeof fetch = fetch,
): Promise<void> {
  const response = await _fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
    },
    body: JSON.stringify({
      from: `Contact Form <${input.fromAddress}>`,
      to: [input.toAddress],
      reply_to: input.email,
      subject: `[Portfolio] ${input.subject}`,
      text: [
        `From: ${input.name} <${input.email}>`,
        `Subject: ${input.subject}`,
        '',
        input.message,
      ].join('\n'),
      html: `
        <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
      `,
    }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`Resend API error ${response.status}`);
  }
}
