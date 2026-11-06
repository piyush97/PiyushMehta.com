import * as Sentry from '@sentry/astro';

const dsn = process.env.SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    release: process.env.npm_package_version,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request)
        event.request = { method: event.request.method, url: event.request.url?.split(/[?#]/)[0] };
      delete event.user;
      return event;
    },
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  });
}
