import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://piyushmehta.com',
  output: 'server',
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 10000,
      customPages: [
        'https://piyushmehta.com/',
        'https://piyushmehta.com/blog/',
        'https://piyushmehta.com/projects/',
        'https://piyushmehta.com/about/',
        'https://piyushmehta.com/contact-me/',
        'https://piyushmehta.com/uses/',
        'https://piyushmehta.com/videos/',
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

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    imageService: true,
    isr: {
      // caches all pages on first request and saves for 1 day
      expiration: 60 * 60 * 24,
    },
  }),
});
