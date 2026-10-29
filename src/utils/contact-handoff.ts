export const HANDOFF_KEY = 'ask-piyush:contact-handoff:v1';
export const HANDOFF_SUBJECT = 'Following up from Ask Piyush';
const MAX_SUBJECT = 150;
const MAX_MESSAGE = 5_000;

export interface ContactHandoff {
  subject: string;
  message: string;
}

export function buildHandoff(question: string, sourceUrls: string[]): ContactHandoff {
  const sources = sourceUrls.length
    ? `\n\nPages I was reading:\n${sourceUrls.map((u) => `- ${u}`).join('\n')}`
    : '';
  return {
    subject: HANDOFF_SUBJECT,
    message: `I asked Ask Piyush: "${question.trim()}"${sources}\n\n`.slice(0, MAX_MESSAGE),
  };
}

/** Parses untrusted storage text; anything malformed yields null so the form starts empty. */
export function parseHandoff(raw: string | null): ContactHandoff | null {
  if (!raw) return null;
  try {
    const { subject, message } = JSON.parse(raw) as Record<string, unknown>;
    if (typeof subject !== 'string' || typeof message !== 'string' || !message.trim()) return null;
    return { subject: subject.slice(0, MAX_SUBJECT), message: message.slice(0, MAX_MESSAGE) };
  } catch {
    return null;
  }
}
