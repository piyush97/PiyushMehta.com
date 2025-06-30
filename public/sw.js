// public/sw.js

// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox loaded successfully');

  // Set workbox config
  workbox.setConfig({
    debug: false,
  });

  // Enable navigation preload if available
  if (workbox.navigationPreload) {
    workbox.navigationPreload.enable();
  }

  // Clean up any old caches
  workbox.precaching.cleanupOutdatedCaches();

  // Precache static assets with cache busting
  const precacheManifest = [
    { url: '/', revision: '1' },
    { url: '/manifest.json', revision: '1' }
  ];

  workbox.precaching.precacheAndRoute(precacheManifest);

  // Cache Google Fonts
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );

  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    })
  );

  // Exclude /pagefind/ from service worker caching
  workbox.routing.registerRoute(
    /\/pagefind\//,
    new workbox.strategies.NetworkOnly()
  );

  // Cache static assets (JS, CSS, images)
  workbox.routing.registerRoute(
    /\.(?:js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
      ],
    })
  );

  // Cache API routes with network first strategy
  workbox.routing.registerRoute(
    /\/api\//,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        }),
      ],
    })
  );

  // Handle navigation requests with a NetworkFirst strategy
  const navigationStrategy = new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  });
  workbox.routing.registerRoute(new workbox.routing.NavigationRoute(navigationStrategy));


  // Handle skip waiting message
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // Background sync for form submissions (optional)
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      console.log('Background sync triggered');
    }
  });

  // Push notification handling (optional)
  self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: data.url,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.notification.data) {
      event.waitUntil(clients.openWindow(event.notification.data));
    }
  });

  console.log('Workbox service worker configured successfully');
} else {
  console.error('Workbox could not be loaded');
}