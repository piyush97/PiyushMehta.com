import { z } from 'zod';
import { MAX_MESSAGE_CHARS } from './sanitize';

export const MAX_BODY_BYTES = 16 * 1024;
export const MAX_HISTORY_TURNS = 6;

/** Reads at most `max` bytes; returns null if the body is larger (chunked bodies included). */
export async function readLimitedText(
  request: Request,
  max = MAX_BODY_BYTES,
): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

const textPart = z.object({ type: z.literal('text'), text: z.string().max(4_000) }).strict();

const message = z.object({
  id: z.string().max(100).optional(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(textPart).min(1).max(4),
});

export const chatRequestSchema = z.object({
  id: z.string().max(100).optional(),
  messages: z.array(message).min(1).max(40),
  trigger: z.string().max(50).optional(),
  messageId: z.string().max(100).optional(),
  turnstileToken: z.string().max(4_096).optional(),
});

export type ChatMessage = { role: 'user' | 'assistant'; text: string };

/**
 * Validates the wire shape, then returns plain-text turns. The last turn must
 * be a user message within the length cap; older turns are trimmed to the window.
 */
export function parseChatRequest(
  raw: unknown,
):
  | { ok: true; history: ChatMessage[]; question: string; turnstileToken?: string }
  | { ok: false; reason: string } {
  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'invalid_shape' };

  const turns: ChatMessage[] = parsed.data.messages.map((m) => ({
    role: m.role,
    text: m.parts.map((p) => p.text).join('\n'),
  }));

  const last = turns[turns.length - 1];
  if (last.role !== 'user') return { ok: false, reason: 'last_not_user' };
  if (last.text.trim().length === 0) return { ok: false, reason: 'empty' };
  if (last.text.length > MAX_MESSAGE_CHARS * 2) return { ok: false, reason: 'too_long' };

  return {
    ok: true,
    history: turns.slice(-MAX_HISTORY_TURNS - 1, -1),
    question: last.text,
    turnstileToken: parsed.data.turnstileToken,
  };
}
