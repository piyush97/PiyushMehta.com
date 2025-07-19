/**
 * Client-side Sentry configuration for browser error tracking
 */
import * as Sentry from '@sentry/astro';

// Initialize Sentry for client-side error tracking
export function initSentry() {
  if (typeof window !== 'undefined' && process.env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.PUBLIC_SENTRY_DSN,
      environment: import.meta.env.MODE || 'production',
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],

      // Performance monitoring
      tracesSampleRate: 0.1,

      // Session replay
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,

      // Disable telemetry
      sendClientReports: false,

      // Filter out common noise
      beforeSend(event) {
        // Filter out extension errors
        if (
          event.exception?.values?.[0]?.stacktrace?.frames?.some((frame) =>
            frame.filename?.includes('extension://')
          )
        ) {
          return null;
        }

        // Filter out network errors from ad blockers
        if (event.message?.includes('Non-Error promise rejection captured')) {
          return null;
        }

        return event;
      },
    });
  }
}

// Utility function to capture errors with context
// biome-ignore lint/suspicious/noExplicitAny: needed for flexible error context
export function captureError(error: Error, context?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    Sentry.captureException(error, {
      tags: {
        component: 'client',
      },
      extra: context,
    });
  }
}

// Utility function to capture messages
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  // biome-ignore lint/suspicious/noExplicitAny: needed for flexible error context
  context?: Record<string, any>
) {
  if (typeof window !== 'undefined') {
    Sentry.captureMessage(message, {
      level,
      tags: {
        component: 'client',
      },
      extra: context,
    });
  }
}
