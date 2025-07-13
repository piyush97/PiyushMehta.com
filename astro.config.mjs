import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import sentry from "@sentry/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://piyushmehta.com",
  output: "server",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    sentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "production",
      tracesSampleRate: 1.0,
      release: process.env.npm_package_version,
      telemetry: false,
      sourceMapsUploadOptions: {
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        // Only upload source maps in production builds
        enabled: process.env.NODE_ENV === "production" && !!process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    mdx(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 10000,
      filter: (page) => !page.includes("?"),
      customPages: [
        "https://piyushmehta.com/",
        "https://piyushmehta.com/blog/",
        "https://piyushmehta.com/projects/",
        "https://piyushmehta.com/about/",
        "https://piyushmehta.com/contact-me/",
        "https://piyushmehta.com/uses/",
        "https://piyushmehta.com/videos/",
        "https://piyushmehta.com/resume/",
        "https://piyushmehta.com/services/",
      ],
    }),
    tailwind(),
    react(),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark-dimmed",
      wrap: true,
    },
  },
  vite: {
    assetsInclude: [
      "**/*.png",
      "**/*.jpg",
      "**/*.jpeg",
      "**/*.gif",
      "**/*.svg",
      "**/*.webp",
    ],
  },
  image: {
    domains: ["piyushmehta.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
    ],
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
      formats: ["image/webp", "image/avif"],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
      domains: ["piyushmehta.com"],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**.githubusercontent.com",
        },
      ],
    },
    isr: {
      // caches all pages on first request and saves for 1 day
      expiration: 60 * 60 * 24,
    },
  }),
});
