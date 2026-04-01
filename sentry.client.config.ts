import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.PUBLIC_VERCEL_ENV || import.meta.env.MODE || 'production',
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    release: import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA,
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    tracesSampleRate: 1,
  });
}
