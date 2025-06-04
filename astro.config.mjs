import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://piyushmehta.com',
  output: 'hybrid',
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile'
    }
  },
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

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'compile',
  }),
  vite: {
    ssr: {
      external: ['pg', 'fs', 'path', 'net', 'tls', 'crypto', 'events', 'util'],
    },
  },
});
