/**
 * Memoized post summaries. Operational state only: a TTL'd string per (note, content digest,
 * prompt version). Redis is not a content store here; the note text stays in the build artifact.
 */
import { checkOutput } from './guard';

/** Bump when the summary prompt changes; every cached summary is then ignored. */
export const SUMMARY_PROMPT_VERSION = 'v2';
export const SUMMARY_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_SUMMARY_CHARS = 4_000;

export interface SummaryStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: string, opts: { ex: number }): Promise<unknown>;
}

export const summaryKey = (slug: string, digest: string) =>
  `chat:summary:${SUMMARY_PROMPT_VERSION}:${slug}:${digest}`;

export type SummaryRead = { ok: true; text: string | null } | { ok: false };

/** `ok: false` means the store failed; callers must not call the model in that case. */
export async function readSummary(key: string, store: SummaryStore | null): Promise<SummaryRead> {
  if (!store) return { ok: false };
  try {
    const value = await store.get(key);
    // A value that is not a clean string, or that no longer passes the output guard, is a miss.
    if (typeof value !== 'string' || value.length === 0 || value.length > MAX_SUMMARY_CHARS)
      return { ok: true, text: null };
    return { ok: true, text: checkOutput(value, 'CANARY-cache') ? null : value };
  } catch {
    return { ok: false };
  }
}

/** Best effort: the reader already has the summary, so a failed write is only a future miss. */
export async function writeSummary(
  key: string,
  text: string,
  store: SummaryStore | null,
): Promise<boolean> {
  if (!store || text.length === 0 || text.length > MAX_SUMMARY_CHARS) return false;
  try {
    await store.set(key, text, { ex: SUMMARY_TTL_SECONDS });
    return true;
  } catch {
    return false;
  }
}
