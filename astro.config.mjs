import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import { SITE } from './src/config';

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  output: 'server',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 10000,
      filter: (page) => !page.includes('?'),
      customPages: [
        `${SITE.website}/`,
        `${SITE.website}/blog/`,
        `${SITE.website}/projects/`,
        `${SITE.website}/about/`,
        `${SITE.website}/contact-me/`,
        `${SITE.website}/uses/`,
        `${SITE.website}/videos/`,
        `${SITE.website}/resume/`,
        `${SITE.website}/services/`,
      ],
    }),
    tailwind(),
    react(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  vite: {
    assetsInclude: [
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.svg',
      '**/*.webp',
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  },
  image: {
    domains: [SITE.website],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com'
      }
    ]
  },

  build: {
    concurrency: 2,
    assetsInlineLimit: 1024,
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    imageService: true,
    imagesConfig: {
      sizes: [320, 640, 768, 1024, 1280, 1536],
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
      domains: [SITE.website],
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
