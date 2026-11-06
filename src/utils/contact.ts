import { escapeXml as escapeHtml } from './xml';

export const MAX_NAME = 100;
export const MAX_EMAIL = 254;
export const MAX_SUBJECT = 150;
export const MAX_MESSAGE = 5_000;

export interface ContactEmailInput {
  apiKey: string;
  fromAddress: string;
  toAddress: string;
  name: string;
  email: string;
  subject: string;
  message: string;
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
