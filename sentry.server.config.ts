import * as Sentry from '@sentry/astro';

const dsn = process.env.SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    tracesSampleRate: 1,
  });
}
