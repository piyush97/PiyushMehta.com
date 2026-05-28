// Service Worker for piyushmehta.com
const CACHE_PREFIXES_TO_REMOVE = [
  'workbox-',
  'pages-cache',
  'critical-css-cache',
  'google-fonts-stylesheets',
  'google-fonts-webfonts',
  'images-cache',
  'static-resources',
  'astro-assets',
  'api-cache',
  'cdn-cache',
];

function shouldRemoveCache(cacheName) {
  return CACHE_PREFIXES_TO_REMOVE.some((prefix) => cacheName.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.flatMap((cacheName) =>
          shouldRemoveCache(cacheName) ? [caches.delete(cacheName)] : []
        )
      );

      await self.clients.claim();
      await self.registration.unregister();

      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      await Promise.all(
        clients.map((client) => {
          if ('navigate' in client) {
            return client.navigate(client.url);
          }

          return undefined;
        })
      );
    })()
  );
});
