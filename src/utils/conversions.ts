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

/** Registry of slugs that ever recorded a view; it bounds the number of keys a read scans. */
export const POST_VIEW_SLUGS_KEY = 'conv:post_view:slugs';
/** The registry outlives daily counters so a quiet post still ages out of the totals window. */
export const POST_VIEW_REGISTRY_TTL_SECONDS = 90 * 24 * 60 * 60;

interface CounterStore {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  mget(...keys: string[]): Promise<unknown[]>;
}

export interface PostViewStore {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  mget(...keys: string[]): Promise<unknown[]>;
  sadd(key: string, member: string): Promise<unknown>;
  smembers?(key: string): Promise<unknown[]>;
}

export function isClientEvent(value: unknown): value is ConversionEvent {
  return typeof value === 'string' && (CLIENT_EVENTS as readonly string[]).includes(value);
}

export function dayKey(event: ConversionEvent, date: Date): string {
  return `conv:${event}:${date.toISOString().slice(0, 10)}`;
}

export function postViewDayKey(slug: string, date: Date): string {
  return `conv:post_view:${slug}:${date.toISOString().slice(0, 10)}`;
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

/** Best effort: a view count must never fail the page load being viewed. */
export async function recordPostView(
  store: PostViewStore | null,
  slug: string,
  now = new Date(),
): Promise<void> {
  if (!store) return;
  try {
    const key = postViewDayKey(slug, now);
    if ((await store.incr(key)) === 1) await store.expire(key, TTL_SECONDS);
    await store.sadd(POST_VIEW_SLUGS_KEY, slug);
    await store.expire(POST_VIEW_SLUGS_KEY, POST_VIEW_REGISTRY_TTL_SECONDS);
  } catch (err) {
    console.warn('[conversions] post view write failed:', (err as Error)?.name);
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

export interface PostViewTotals {
  slug: string;
  current: number;
  previous: number;
}

/** Per-post totals for the last WINDOW_DAYS (today included) and the window before it. Throws on store failure. */
export async function readPostViewTotals(
  store: PostViewStore,
  now = new Date(),
): Promise<PostViewTotals[]> {
  const members = (await store.smembers?.(POST_VIEW_SLUGS_KEY)) ?? [];
  const slugs = [...new Set(members.filter((m): m is string => typeof m === 'string'))];
  if (slugs.length === 0) return [];
  const days = Array.from(
    { length: WINDOW_DAYS * 2 },
    (_, i) => new Date(now.getTime() - i * DAY_MS),
  );
  const keys = slugs.flatMap((slug) => days.map((d) => postViewDayKey(slug, d)));
  const values = await store.mget(...keys);
  return slugs
    .map((slug, s) => {
      const slice = values.slice(s * days.length, (s + 1) * days.length).map(toCount);
      return {
        slug,
        current: sum(slice.slice(0, WINDOW_DAYS)),
        previous: sum(slice.slice(WINDOW_DAYS)),
      };
    })
    .sort((a, b) => b.current - a.current || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
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
