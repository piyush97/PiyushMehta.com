import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
  });
}
