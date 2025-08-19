// Advanced Service Worker for Performance Optimization
// Version 3.0 - Enhanced caching strategies and Core Web Vitals optimization

const CACHE_VERSION = 'v3.0';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`,
  css: `css-${CACHE_VERSION}`,
  js: `js-${CACHE_VERSION}`
};

// Import Workbox from CDN with advanced features
importScripts('/scripts/indexeddb.js');
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Enhanced image optimization and responsive caching with format detection
const IMAGE_CACHE_STRATEGIES = {
  // AVIF images - best compression, cache longest
  avif: {
    strategy: 'CacheFirst',
    cacheName: 'images-avif',
    expiration: {
      maxEntries: 150,
      maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
      purgeOnQuotaError: true
    }
  },
  
  // WebP images - good compression, medium cache
  webp: {
    strategy: 'CacheFirst',
    cacheName: 'images-webp',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 45 * 24 * 60 * 60, // 45 days
      purgeOnQuotaError: true
    }
  },
  
  // JPEG/PNG fallbacks - shorter cache
  legacy: {
    strategy: 'CacheFirst',
    cacheName: CACHE_NAMES.images,
    expiration: {
      maxEntries: 250,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      purgeOnQuotaError: true
    }
  },
  
  // Responsive image variants
  responsive: {
    strategy: 'CacheFirst', 
    cacheName: 'images-responsive',
    expiration: {
      maxEntries: 300,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      purgeOnQuotaError: true
    }
  },
  
  // Ultra-small placeholders - cache very long
  placeholder: {
    strategy: 'CacheFirst',
    cacheName: 'image-placeholders',
    expiration: {
      maxEntries: 1000, // Small files, can cache more
      maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
      purgeOnQuotaError: true
    }
  },
  
  // CDN optimized images
  cdn: {
    strategy: 'StaleWhileRevalidate',
    cacheName: 'images-cdn',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days - shorter for CDN
      purgeOnQuotaError: true
    }
  }
};

if (workbox) {
  console.log('Advanced Workbox service worker v3.0 loaded');

  // Advanced workbox configuration
  workbox.setConfig({
    debug: false,
    modulePathPrefix: 'https://storage.googleapis.com/workbox-cdn/releases/7.0.0/modules/'
  });

  // Enable navigation preload with performance hints
  if (workbox.navigationPreload) {
    workbox.navigationPreload.enable();
  }

  // Advanced cache cleanup
  workbox.precaching.cleanupOutdatedCaches();

  // Enhanced precache manifest with critical resources and performance hints
  const precacheManifest = [
    { url: '/', revision: '3', integrity: 'sha384-...' },
    { url: '/blog/', revision: '3' },
    { url: '/manifest.json', revision: '3' },
    { url: '/offline/', revision: '2' },
    // Critical CSS and JS resources
    { url: '/assets/critical.css', revision: '1' },
    { url: '/chunks/vendor-react.js', revision: '1' },
    // Critical image placeholders
    { url: '/images/placeholder-40x30.svg', revision: '1' },
    { url: '/images/hero-placeholder.webp', revision: '1' }
  ];

  workbox.precaching.precacheAndRoute(precacheManifest, {
    // Ignore URL parameters for better cache hits
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
  });

  // ============ ADVANCED CACHING STRATEGIES ============

  // 1. Critical CSS - Cache First (Instant Loading)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' && request.url.includes('critical'),
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.css,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          purgeOnQuotaError: true,
        }),
        new workbox.broadcastUpdate.BroadcastUpdatePlugin(),
      ],
    })
  );

  // 2. JavaScript Chunks - Stale While Revalidate (Performance + Freshness)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_NAMES.js,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 3. Enhanced Images - Advanced Format-Based Caching
  workbox.routing.registerRoute(
    ({ request, url }) => {
      return request.destination === 'image' || 
             /\.(jpg|jpeg|png|gif|webp|avif|svg)($|\?)/i.test(url.pathname);
    },
    async ({ request, url }) => {
      return handleAdvancedImageCaching(request, url);
    }
  );

  // Image optimization API endpoint
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/api/image-optimization'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'image-optimization-api',
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 4. API Routes - Network First with Cache Fallback
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.api,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutes
        }),
        new workbox.backgroundSync.BackgroundSyncPlugin('api-queue', {
          maxRetentionTime: 24 * 60 // 24 hours
        }),
      ],
    })
  );

  // 4. Images - Cache First with Advanced Optimization
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.images,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          purgeOnQuotaError: true,
        }),
        {
          // Custom plugin for image optimization caching
          cacheKeyWillBeUsed: async ({ request }) => {
            // Normalize image URLs for better cache hits
            const url = new URL(request.url);
            // Remove dynamic query parameters but keep format/quality params
            url.searchParams.delete('v');
            url.searchParams.delete('t');
            return url.href;
          },
        },
      ],
    })
  );

  // 5. Fonts - Cache First (Long-term caching)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.fonts,
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

  // 6. Google Fonts - Stale While Revalidate
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
                 url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    })
  );

  // 7. Navigation - Network First with Cache Fallback
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'navigation',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        {
          // Custom plugin for offline fallback
          handlerDidError: async () => {
            return caches.match('/offline/');
          },
        },
      ],
    })
  );

  // ============ PERFORMANCE OPTIMIZATIONS ============

  // Intelligent prefetching based on user interaction
  const prefetchController = {
    prefetchedUrls: new Set(),
    
    async prefetchUrl(url) {
      if (this.prefetchedUrls.has(url)) return;
      
      try {
        const cache = await caches.open(CACHE_NAMES.dynamic);
        const response = await fetch(url, { mode: 'no-cors' });
        
        if (response.ok) {
          await cache.put(url, response.clone());
          this.prefetchedUrls.add(url);
        }
      } catch (error) {
        console.warn('Prefetch failed for:', url, error);
      }
    },

    async prefetchCriticalResources() {
      const criticalUrls = [
        '/assets/critical.css',
        '/chunks/vendor-react.js',
        '/chunks/vendor-utils.js'
      ];

      await Promise.allSettled(
        criticalUrls.map(url => this.prefetchUrl(url))
      );
    }
  };

  // Prefetch critical resources on install
  self.addEventListener('install', (event) => {
    event.waitUntil(
      Promise.all([
        self.skipWaiting(),
        prefetchController.prefetchCriticalResources()
      ])
    );
  });

  // ============ ADVANCED FEATURES ============

  // Background sync for offline form submissions
  workbox.routing.registerRoute(
    /\/api\/newsletter/,
    new workbox.strategies.NetworkOnly({
      plugins: [
        new workbox.backgroundSync.BackgroundSyncPlugin('newsletter-queue', {
          maxRetentionTime: 24 * 60 // 24 hours
        }),
      ],
    }),
    'POST'
  );

  // Performance monitoring integration
  workbox.googleAnalytics.initialize({
    parameterOverrides: {
      custom_map: {
        dimension1: 'cache_hit'
      }
    }
  });

  // Cache size monitoring and cleanup
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_STATS') {
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ stats });
      });
    }
  });

  async function getCacheStats() {
    const cacheNames = Object.values(CACHE_NAMES);
    const stats = {};

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        let totalSize = 0;
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }

        stats[cacheName] = {
          entries: keys.length,
          size: totalSize
        };
      } catch (error) {
        stats[cacheName] = { entries: 0, size: 0, error: error.message };
      }
    }

    return stats;
  }

  // Runtime cache size management
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.all([
        self.clients.claim(),
        cleanupOldCaches()
      ])
    );
  });

  async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCacheNames = Object.values(CACHE_NAMES);
    
    return Promise.all(
      cacheNames.map(cacheName => {
        if (!currentCacheNames.includes(cacheName)) {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  }

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

  // ============ ADVANCED IMAGE OPTIMIZATION FUNCTIONS ============

  // Advanced image cache strategy selection with format detection
  function getAdvancedImageCacheStrategy(url, request) {
    const pathname = url.pathname.toLowerCase();
    const acceptHeader = request.headers.get('accept') || '';
    
    // Ultra-small placeholders (cache longest)
    if (pathname.includes('placeholder') || 
        url.searchParams.has('placeholder') ||
        pathname.includes('_placeholder') ||
        parseInt(url.searchParams.get('w') || '0') <= 50) {
      return IMAGE_CACHE_STRATEGIES.placeholder;
    }
    
    // CDN images (special handling)
    if (url.hostname.includes('cdn') || 
        url.hostname.includes('cloudflare') ||
        url.hostname.includes('fastly') ||
        url.hostname.includes('imagekit') ||
        url.hostname.includes('cloudinary')) {
      return IMAGE_CACHE_STRATEGIES.cdn;
    }
    
    // Format-specific caching based on file extension and Accept header
    if (pathname.includes('.avif') || 
        url.searchParams.get('f') === 'avif' ||
        acceptHeader.includes('image/avif')) {
      return IMAGE_CACHE_STRATEGIES.avif;
    }
    
    if (pathname.includes('.webp') || 
        url.searchParams.get('f') === 'webp' ||
        acceptHeader.includes('image/webp')) {
      return IMAGE_CACHE_STRATEGIES.webp;
    }
    
    // Responsive image variants
    if (url.searchParams.has('w') || url.searchParams.has('h') || 
        pathname.includes('_responsive') || 
        pathname.includes('/responsive/') ||
        url.searchParams.has('sizes')) {
      return IMAGE_CACHE_STRATEGIES.responsive;
    }
    
    // Legacy formats (JPEG, PNG)
    return IMAGE_CACHE_STRATEGIES.legacy;
  }

  // Handle advanced image caching with intelligent optimization
  async function handleAdvancedImageCaching(request, url) {
    const strategy = getAdvancedImageCacheStrategy(url, request);
    
    if (strategy.strategy === 'CacheFirst') {
      return cacheFirstImage(request, strategy);
    } else {
      return staleWhileRevalidateImage(request, strategy);
    }
  }

  // Enhanced cache-first strategy for images with intelligent optimization
  async function cacheFirstImage(request, strategy) {
    const cache = await caches.open(strategy.cacheName);
    const cacheKey = generateCacheKey(request);
    const startTime = performance.now();
    
    try {
      // Try cache first
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        // Check if cached image is still valid
        const cacheAge = Date.now() - new Date(cachedResponse.headers.get('date') || 0).getTime();
        const maxAge = strategy.expiration.maxAgeSeconds * 1000;
        
        if (cacheAge < maxAge) {
          updatePerformanceMetrics('cache-hit', 'image', performance.now() - startTime);
          return cachedResponse;
        }
      }
      
      // Fetch from network with optimizations
      const optimizedRequest = await optimizeImageRequest(request);
      const networkResponse = await fetch(optimizedRequest);
      
      if (networkResponse.ok) {
        // Validate image response
        if (await isValidImageResponse(networkResponse)) {
          const responseClone = networkResponse.clone();
          await cache.put(cacheKey, responseClone);
          updatePerformanceMetrics('cache-miss', 'image', performance.now() - startTime);
          
          // Cleanup old cache entries if needed
          await cleanupImageCache(cache, strategy.expiration.maxEntries);
        }
      }
      
      return networkResponse;
    } catch (error) {
      console.warn('Image cache-first failed:', error);
      updatePerformanceMetrics('network-error', 'image', performance.now() - startTime);
      
      // Try to return stale cache as fallback
      const staleResponse = await cache.match(cacheKey);
      if (staleResponse) {
        return staleResponse;
      }
      
      // Return fallback placeholder if available
      return await getFallbackImageResponse();
    }
  }

  // Enhanced stale-while-revalidate for dynamic images with background optimization
  async function staleWhileRevalidateImage(request, strategy) {
    const cache = await caches.open(strategy.cacheName);
    const cacheKey = generateCacheKey(request);
    const startTime = performance.now();
    
    try {
      // Try cache first for immediate response
      const cachedResponse = await cache.match(cacheKey);
      
      // Start background network request for fresh content
      const networkPromise = optimizeImageRequest(request)
        .then(optimizedRequest => fetch(optimizedRequest))
        .then(async response => {
          if (response.ok && await isValidImageResponse(response)) {
            const responseClone = response.clone();
            await cache.put(cacheKey, responseClone);
            updatePerformanceMetrics('background-update', 'image', performance.now() - startTime);
            
            // Notify about fresh content available
            await notifyImageUpdate(cacheKey, response);
          }
          return response;
        })
        .catch(error => {
          console.warn('Background image update failed:', error);
          updatePerformanceMetrics('background-error', 'image', performance.now() - startTime);
        });
      
      // Return cached version immediately if available
      if (cachedResponse) {
        updatePerformanceMetrics('stale-served', 'image', performance.now() - startTime);
        // Don't await the background update
        networkPromise;
        return cachedResponse;
      }
      
      // Return fresh network response if no cache
      updatePerformanceMetrics('cache-miss', 'image', performance.now() - startTime);
      return await networkPromise;
    } catch (error) {
      console.warn('Image stale-while-revalidate failed:', error);
      updatePerformanceMetrics('network-error', 'image', performance.now() - startTime);
      
      // Return fallback placeholder
      return await getFallbackImageResponse();
    }
  }

  // Optimize image request with Accept headers and quality hints
  async function optimizeImageRequest(request) {
    const url = new URL(request.url);
    
    // Add modern format Accept header if not present
    const headers = new Headers(request.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'image/avif,image/webp,image/*,*/*;q=0.8');
    }
    
    // Add quality hints for CDN optimization
    if (!url.searchParams.has('q') && url.hostname.includes('cdn')) {
      url.searchParams.set('auto', 'format,compress');
      url.searchParams.set('q', '85');
    }
    
    return new Request(url.toString(), {
      method: request.method,
      headers,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer
    });
  }

  // Validate image response before caching
  async function isValidImageResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    
    // Must be an image type
    if (!contentType.startsWith('image/')) {
      return false;
    }
    
    // Must have reasonable size (not too small, not too large)
    if (contentLength > 0 && (contentLength < 100 || contentLength > 10 * 1024 * 1024)) {
      return false;
    }
    
    return true;
  }

  // Generate cache key with optimization parameters
  function generateCacheKey(request) {
    const url = new URL(request.url);
    
    // Include relevant optimization parameters in cache key
    const relevantParams = ['w', 'h', 'q', 'f', 'auto', 'format'];
    const params = new URLSearchParams();
    
    relevantParams.forEach(param => {
      if (url.searchParams.has(param)) {
        params.set(param, url.searchParams.get(param));
      }
    });
    
    const cacheUrl = `${url.origin}${url.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    return new Request(cacheUrl, {
      method: request.method,
      headers: { 'Accept': request.headers.get('Accept') || '' }
    });
  }

  // Cleanup old cache entries to maintain size limits
  async function cleanupImageCache(cache, maxEntries) {
    try {
      const keys = await cache.keys();
      if (keys.length <= maxEntries) return;
      
      // Sort by last modified (oldest first)
      const keysWithDates = await Promise.all(
        keys.map(async key => {
          const response = await cache.match(key);
          const lastModified = response?.headers.get('date') || '0';
          return { key, date: new Date(lastModified).getTime() };
        })
      );
      
      keysWithDates.sort((a, b) => a.date - b.date);
      
      // Delete oldest entries
      const keysToDelete = keysWithDates.slice(0, keys.length - maxEntries);
      await Promise.all(
        keysToDelete.map(({ key }) => cache.delete(key))
      );
      
      console.log(`Cleaned up ${keysToDelete.length} old image cache entries`);
    } catch (error) {
      console.warn('Image cache cleanup failed:', error);
    }
  }

  // Get fallback image response for failed loads
  async function getFallbackImageResponse() {
    // Return a simple 1x1 transparent PNG as fallback
    const fallbackData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const binaryString = atob(fallbackData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Response(bytes, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': bytes.length.toString(),
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }

  // Notify clients about image updates
  async function notifyImageUpdate(cacheKey, response) {
    try {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'IMAGE_UPDATED',
          cacheKey: cacheKey.url,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        });
      });
    } catch (error) {
      console.warn('Failed to notify image update:', error);
    }
  }

  // Enhanced performance metrics for images
  function updatePerformanceMetrics(type, category, duration) {
    const metric = {
      type,
      category,
      duration: duration || 0,
      timestamp: Date.now()
    };
    
    // Log performance warnings
    if (category === 'image' && duration > 1000) {
      console.warn(`Slow image ${type}:`, duration.toFixed(2) + 'ms');
    }
    
    // Store metrics for analytics (could send to analytics service)
    console.log('Image performance metric:', metric);
  }

  console.log('Enhanced Workbox service worker configured successfully');
  console.log('Advanced image optimization and Core Web Vitals optimizations enabled');
  
} else {
  console.error('Workbox could not be loaded - falling back to basic caching with image optimization');
  
  // Basic fallback service worker without Workbox but with image optimization
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle image requests with basic optimization
    if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|avif|svg)($|\?)/i.test(url.pathname)) {
      event.respondWith(handleBasicImageCaching(request));
      return;
    }
    
    // Handle navigation requests
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Advanced image optimization available when online.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
      );
    }
  });
  
  // Basic image caching without Workbox
  async function handleBasicImageCaching(request) {
    const cacheName = 'basic-images-cache';
    const cache = await caches.open(cacheName);
    
    try {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
      }
      
      return networkResponse;
    } catch (error) {
      console.warn('Basic image caching failed:', error);
      
      // Return cached version if available
      const staleResponse = await cache.match(request);
      if (staleResponse) {
        return staleResponse;
      }
      
      throw error;
    }
  }
}