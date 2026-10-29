/**
 * Anonymous daily conversion totals. One Redis counter per event per UTC day; no visitor data.
 * Contract: src/pages/SPEC.md (Conversion counts) and ADR-0001 item 6.
 */
export const CONVERSION_EVENTS = [
  'contact_sent',
  'resume_download',
  'chat_question',
  'reading_path_click',
] as const;
export type ConversionEvent = (typeof CONVERSION_EVENTS)[number];

/** Events a browser may report; server-counted events cannot be posted. */
export const CLIENT_EVENTS: readonly ConversionEvent[] = ['resume_download', 'reading_path_click'];

export const WINDOW_DAYS = 28;
const TTL_SECONDS = 60 * 24 * 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

interface CounterStore {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  mget(...keys: string[]): Promise<unknown[]>;
}

export function isClientEvent(value: unknown): value is ConversionEvent {
  return typeof value === 'string' && (CLIENT_EVENTS as readonly string[]).includes(value);
}

export function dayKey(event: ConversionEvent, date: Date): string {
  return `conv:${event}:${date.toISOString().slice(0, 10)}`;
}

/** Best effort: a counting failure must never fail the action being counted. */
export async function recordConversion(
  store: CounterStore | null,
  event: ConversionEvent,
  now = new Date(),
): Promise<void> {
  if (!store) return;
  try {
    const key = dayKey(event, now);
    if ((await store.incr(key)) === 1) await store.expire(key, TTL_SECONDS);
  } catch (err) {
    console.warn('[conversions] write failed:', (err as Error)?.name);
  }
}

export interface ConversionTotals {
  event: ConversionEvent;
  current: number;
  previous: number;
}

/** Totals for the last WINDOW_DAYS (today included) and the window before it. Throws on store failure. */
export async function readConversionTotals(
  store: CounterStore,
  now = new Date(),
): Promise<ConversionTotals[]> {
  const days = Array.from(
    { length: WINDOW_DAYS * 2 },
    (_, i) => new Date(now.getTime() - i * DAY_MS),
  );
  const keys = CONVERSION_EVENTS.flatMap((event) => days.map((d) => dayKey(event, d)));
  const values = await store.mget(...keys);
  return CONVERSION_EVENTS.map((event, e) => {
    const slice = values.slice(e * days.length, (e + 1) * days.length).map(toCount);
    return {
      event,
      current: sum(slice.slice(0, WINDOW_DAYS)),
      previous: sum(slice.slice(WINDOW_DAYS)),
    };
  });
}

function toCount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Runs a write after the response when the Worker context allows it. */
export function runInBackground(locals: unknown, task: Promise<void>): void {
  try {
    const ctx = (locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
    if (ctx) return ctx.waitUntil(task);
  } catch {
    // No Worker context (tests, some dev setups): the task still runs unawaited.
  }
  void task;
}

/** Constant-time check of an HTTP Basic password; the username is ignored. */
export async function checkBasicPassword(
  header: string | null,
  expected: string,
): Promise<boolean> {
  if (!header?.startsWith('Basic ') || !expected) return false;
  let supplied: string;
  try {
    const decoded = atob(header.slice(6).trim());
    supplied = decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return false;
  }
  const digest = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(supplied), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
