// Enhanced Service Worker for Core Web Vitals Optimization
// public/sw.js

// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Enhanced Workbox service worker loaded successfully');

  // Set workbox config for performance
  workbox.setConfig({
    debug: false,
  });

  // Enable navigation preload for faster page loads
  if (workbox.navigationPreload) {
    workbox.navigationPreload.enable();
  }

  // Clean up any old caches
  workbox.precaching.cleanupOutdatedCaches();

  // Enhanced precache manifest with critical resources
  const precacheManifest = [
    { url: '/', revision: '2' },
    { url: '/blog/', revision: '2' },
    { url: '/manifest.json', revision: '2' },
    { url: '/offline/', revision: '1' }
  ];

  workbox.precaching.precacheAndRoute(precacheManifest);

  // Critical CSS caching strategy for instant loading
  workbox.routing.registerRoute(
    /\/src\/styles\/critical\/.*\.css$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'critical-css-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year for critical CSS
        }),
      ],
    })
  );

  // Enhanced font caching for better LCP
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
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
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    })
  );

  // Image optimization caching with size limits
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|webp|avif|svg)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          maxSizeBytes: 50 * 1024 * 1024, // 50MB limit
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // JavaScript and CSS caching for performance
  workbox.routing.registerRoute(
    /\.(?:js|css)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        }),
      ],
    })
  );

  // Astro build assets with aggressive caching
  workbox.routing.registerRoute(
    /\/_astro\//,
    new workbox.strategies.CacheFirst({
      cacheName: 'astro-assets',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year for build assets
        }),
      ],
    })
  );

  // Exclude search index from caching for accurate results
  workbox.routing.registerRoute(
    /\/pagefind\//,
    new workbox.strategies.NetworkOnly()
  );

  // API routes with intelligent caching
  workbox.routing.registerRoute(
    /\/api\//,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour for API responses
        }),
      ],
    })
  );

  // CDN resources caching
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://cdn.jsdelivr.net' ||
                url.origin === 'https://unpkg.com' ||
                url.origin === 'https://cdnjs.cloudflare.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'cdn-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
      ],
    })
  );

  // Enhanced navigation strategy with offline fallback
  const navigationStrategy = new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  });

  // Navigation route with offline fallback
  workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(navigationStrategy, {
      allowlist: [/^\/(?!api|_astro)/], // Don't handle API or build asset requests
    })
  );


  // Enhanced messaging for performance optimization
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    
    // Handle prefetch requests for better performance
    if (event.data && event.data.type === 'PREFETCH_RESOURCE') {
      handlePrefetchResource(event.data.url);
    }
    
    // Handle performance metrics logging
    if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
      logPerformanceMetric(event.data.metric);
    }
    
    // Return cache statistics for debugging
    if (event.data && event.data.type === 'GET_CACHE_STATS') {
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', stats });
      });
    }
  });

  // Enhanced background sync with form queue management
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(handleBackgroundSync());
    }
  });

  // Enhanced push notification handling
  self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: data.url,
      actions: [
        { action: 'open', title: 'Read Now' },
        { action: 'close', title: 'Dismiss' }
      ],
      requireInteraction: true,
      vibrate: [100, 50, 100]
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' && event.notification.data) {
      event.waitUntil(clients.openWindow(event.notification.data));
    }
  });

  // Offline fallback handling
  self.addEventListener('fetch', (event) => {
    // Handle navigation requests with offline fallback
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(async () => {
          const cache = await caches.open('pages-cache');
          const offlinePage = await cache.match('/offline/');
          return offlinePage || new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
      );
    }
  });

  // Performance optimization functions
  async function handlePrefetchResource(url) {
    try {
      const cache = await caches.open('pages-cache');
      const cachedResponse = await cache.match(url);
      
      if (!cachedResponse) {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('Prefetched resource:', url);
        }
      }
    } catch (error) {
      console.warn('Failed to prefetch resource:', url, error);
    }
  }

  function logPerformanceMetric(metric) {
    console.log('Performance metric received:', metric);
    
    // Log warnings for poor metrics
    if (metric.name === 'LCP' && metric.value > 2500) {
      console.warn('Poor LCP detected:', metric.value + 'ms');
    }
    
    if (metric.name === 'FID' && metric.value > 100) {
      console.warn('Poor FID detected:', metric.value + 'ms');
    }
    
    if (metric.name === 'CLS' && metric.value > 0.1) {
      console.warn('Poor CLS detected:', metric.value);
    }
  }

  async function getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = keys.length;
    }
    
    return stats;
  }

  async function handleBackgroundSync() {
    console.log('Background sync triggered - handling queued requests');
    
    // Handle any queued form submissions or API calls
    try {
      const queuedRequests = await getQueuedRequests();
      
      for (const request of queuedRequests) {
        try {
          await fetch(request.url, {
            method: request.method,
            body: request.body,
            headers: request.headers
          });
          
          await removeFromQueue(request.id);
          console.log('Successfully synced queued request:', request.id);
          
        } catch (error) {
          console.warn('Failed to sync request:', request.id, error);
        }
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  async function getQueuedRequests() {
    // Simple implementation - in production, use IndexedDB
    return JSON.parse(localStorage.getItem('sw-queue') || '[]');
  }

  async function removeFromQueue(id) {
    const queue = await getQueuedRequests();
    const updatedQueue = queue.filter(item => item.id !== id);
    localStorage.setItem('sw-queue', JSON.stringify(updatedQueue));
  }

  console.log('Enhanced Workbox service worker configured successfully');
  console.log('Core Web Vitals optimizations enabled');
  
} else {
  console.error('Workbox could not be loaded - falling back to basic caching');
  
  // Basic fallback service worker without Workbox
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
      );
    }
  });
}