import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import varlock from '@varlock/astro-integration';
import { defineConfig, memoryCache } from 'astro/config';

const isProductionBuild = process.env.NODE_ENV === 'production';
const hasSentryAuth = Boolean(process.env.SENTRY_AUTH_TOKEN);
const hasClientSentryDsn = Boolean(process.env.PUBLIC_SENTRY_DSN);
const hasServerSentryDsn = Boolean(process.env.SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN);

export default defineConfig({
  site: 'https://piyushmehta.com',
  output: 'server',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // Astro v7 stable caching — enables Astro.cache.set() on server routes and APIs
  cache: {
    provider: memoryCache({ max: 500 }),
  },
  // Route-level cache rules for API and content routes
  routeRules: {
    '/rss.xml': { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
    '/sitemap.xml': { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
    '/robots.txt': { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
  },
  experimental: {
    // Speculative prerendering of prefetched pages — instant navigation
    clientPrerender: true,
    // Reuse unchanged prerendered pages between builds when cacheKey + module graph are unchanged
    incrementalBuild: true,
  },
  // Sessions are not used in this project; skip session runtime wiring to reduce SSR bundle/runtime work
  session: false,
  integrations: [
    varlock(),
    sentry({
      enabled: {
        client: hasClientSentryDsn,
        server: hasServerSentryDsn,
      },
      sourceMapsUploadOptions: {
        enabled: isProductionBuild && hasSentryAuth,
        telemetry: false,
        ...(isProductionBuild && {
          assets: ['dist/_astro/**/*.js', 'dist/_astro/**/*.mjs'],
          filesToDeleteAfterUpload: ['dist/_astro/**/*.map'],
        }),
      },
    }),
    mdx(),
    react(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: isProductionBuild ? 'hidden' : false,
    },
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
        '@/components': new URL('./src/components', import.meta.url).pathname,
        '@/layouts': new URL('./src/layouts', import.meta.url).pathname,
        '@/pages': new URL('./src/pages', import.meta.url).pathname,
        '@/utils': new URL('./src/utils', import.meta.url).pathname,
        '@/types': new URL('./src/types', import.meta.url).pathname,
        '@/content': new URL('./src/content', import.meta.url).pathname,
        '@/assets': new URL('./src/assets', import.meta.url).pathname,
        '@/styles': new URL('./src/styles', import.meta.url).pathname,
        '@/middleware': new URL('./src/middleware', import.meta.url).pathname,
        '@/app': new URL('./src/app', import.meta.url).pathname,
        '@/scripts': new URL('./scripts', import.meta.url).pathname,
      },
    },
  },
  image: {
    domains: ['piyushmehta.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },

  build: {
    // Incremental static builds currently require concurrency: 1 to use the cache.
    concurrency: 1,
    assetsInlineLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendor libraries (rarely change, cache for long time)
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@astrojs/')) {
              return 'vendor-astro';
            }
            if (id.includes('@sentry/')) {
              return 'vendor-monitoring';
            }
            if (id.includes('satori') || id.includes('@resvg') || id.includes('@vercel/og')) {
              return 'vendor-images';
            }
            // Other third-party packages
            return 'vendor-libs';
          }

          // Application code chunking
          if (id.includes('/src/components/blog/')) {
            return 'components-blog';
          }
          if (
            id.includes('CommentSystem') ||
            id.includes('AuthModal') ||
            id.includes('NewsletterForm')
          ) {
            return 'components-interactive';
          }
          if (id.includes('/src/utils/')) {
            return 'utils';
          }
          if (id.includes('/src/middleware/')) {
            return 'middleware';
          }
        },
      },
    },
  },

  adapter: vercel({
    webAnalytics: {
      enabled: process.env.NODE_ENV === 'production',
    },
    imageService: true,
    imagesConfig: {
      sizes: [320, 640, 768, 1024, 1280, 1536],
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
      domains: ['piyushmehta.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**.githubusercontent.com',
        },
      ],
    },
    isr: {
      // caches all pages on first request and saves for 1 day
      expiration: 60 * 60 * 24,
    },
  }),
});
