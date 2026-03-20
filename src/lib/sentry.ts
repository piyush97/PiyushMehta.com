// src/lib/sentry.ts
// @sentry/cloudflare uses withSentry() to wrap the Worker fetch handler.
// Do NOT call Sentry.init() on each request — it is called once at the entry point.
// This module exports a helper to get the DSN from context.
export function getSentryDsn(cfEnv: Record<string, unknown>): string | undefined {
  return typeof cfEnv.SENTRY_DSN === 'string' ? cfEnv.SENTRY_DSN : undefined
}
