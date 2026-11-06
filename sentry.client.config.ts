import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    integrations: [Sentry.browserTracingIntegration()],
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.user;
      if (event.request)
        event.request = { url: event.request.url?.split(/[?#]/)[0], method: event.request.method };
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      return breadcrumb.category === 'navigation' ? null : breadcrumb;
    },
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
  });
  const loadReplay = () => {
    window.removeEventListener('pointerdown', loadReplay);
    window.removeEventListener('keydown', loadReplay);
    void import('@sentry/replay')
      .then(({ replayIntegration }) => {
        Sentry.addIntegration(replayIntegration({ maskAllText: true, blockAllMedia: true }));
      })
      .catch(() => {});
  };
  window.addEventListener('pointerdown', loadReplay, { once: true, passive: true });
  window.addEventListener('keydown', loadReplay, { once: true });
}
