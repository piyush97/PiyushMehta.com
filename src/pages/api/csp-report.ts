import type { APIRoute } from 'astro';
import { readLimitedText } from '@/utils/request-security';

export const prerender = false;

const MAX_BODY_BYTES = 8 * 1024;
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const DEDUPE_MAX_ENTRIES = 200;
const MAX_FIELD_LENGTH = 100;

/** Whitelisted, already-normalized fields. Nothing else is ever logged. */
interface ReportEntry {
  directive: string;
  blocked: string;
  document: string;
  disposition: string;
  sourceFile?: string;
  lineNumber?: number;
}

const lastLogged = new Map<string, number>();

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Scheme, host and path only: queries, fragments and credentials are dropped. */
function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return null;
  }
}

/** Only the scheme is kept for `data:` payloads; source tokens like `inline` stay. */
function sanitizeBlocked(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.startsWith('data:')) return 'data:';
  const url = sanitizeUrl(trimmed);
  return url ?? trimmed.slice(0, MAX_FIELD_LENGTH);
}

function sanitizeDirective(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return /^[a-z0-9-]{1,64}$/.test(token) ? token : null;
}

/** Normalizes one report body, or returns `null` when it carries no useful signal. */
export function normalizeReport(payload: unknown): ReportEntry | null {
  const body = asRecord(payload);
  if (!body) return null;

  const directive = sanitizeDirective(body['effective-directive'] ?? body['violated-directive']);
  const document = sanitizeUrl(body['document-uri']);
  if (!directive || !document) return null;

  const entry: ReportEntry = {
    directive,
    blocked: sanitizeBlocked(body['blocked-uri']) ?? 'unknown',
    document,
    disposition:
      typeof body.disposition === 'string' && /^[a-z]{1,32}$/.test(body.disposition)
        ? body.disposition
        : 'report',
  };

  const sourceFile = sanitizeUrl(body['source-file']);
  if (sourceFile) entry.sourceFile = sourceFile;

  const lineNumber = Number(body['line-number']);
  if (Number.isInteger(lineNumber) && lineNumber > 0) entry.lineNumber = lineNumber;

  return entry;
}

/** Accepts legacy `{ "csp-report": {...} }`, Reporting API `[{ type, body }]` and bare bodies. */
function reportBodies(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => {
      const record = asRecord(item);
      return record ? record.body : null;
    });
  }
  const record = asRecord(payload);
  return record ? [record['csp-report'] ?? record] : [];
}

/** Best-effort flood control per isolate; exact counts are not required. */
function shouldLog(entry: ReportEntry, now: number): boolean {
  const key = `${entry.directive}|${entry.document}`;
  const seen = lastLogged.get(key);
  if (seen !== undefined && now - seen < DEDUPE_WINDOW_MS) return false;

  if (seen === undefined && lastLogged.size >= DEDUPE_MAX_ENTRIES) {
    for (const [other, at] of lastLogged) {
      if (now - at >= DEDUPE_WINDOW_MS) lastLogged.delete(other);
    }
    if (lastLogged.size >= DEDUPE_MAX_ENTRIES) return false;
  }

  lastLogged.set(key, now);
  return true;
}

/**
 * CSP violation collector. Reports are unauthenticated browser noise, so this
 * always answers 204: no origin gate, no storage, no error surface.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const text = await readLimitedText(request, MAX_BODY_BYTES);
    if (text) {
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }

      const now = Date.now();
      for (const body of reportBodies(payload)) {
        const entry = normalizeReport(body);
        if (entry && shouldLog(entry, now)) console.warn('[csp-report]', JSON.stringify(entry));
      }
    }
  } catch {
    // A broken report must never turn into a 4xx/5xx for the browser.
  }

  return new Response(null, { status: 204 });
};
