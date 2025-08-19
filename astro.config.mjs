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
    throttle: 3, // Limit concurrent prefetches
  },
  integrations: [
    sentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "production",
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
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
    env: {
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
    },
    assetsInclude: [
      "**/*.png",
      "**/*.jpg",
      "**/*.jpeg",
      "**/*.gif",
      "**/*.svg",
      "**/*.webp",
    ],
    build: {
      rollupOptions: {
        output: {
          // Advanced chunk splitting for optimal caching and loading
          manualChunks: (id) => {
            // Vendor libraries (large, rarely changing)
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              
              // tRPC and related APIs
              if (id.includes('@trpc') || id.includes('superjson')) {
                return 'vendor-trpc';
              }
              
              // Form validation and utilities
              if (id.includes('zod') || id.includes('clsx') || id.includes('class-variance-authority')) {
                return 'vendor-utils';
              }
              
              // Monitoring and analytics
              if (id.includes('@sentry') || id.includes('@vercel')) {
                return 'vendor-monitoring';
              }
              
              // Image processing (heavy)
              if (id.includes('satori') || id.includes('@resvg') || id.includes('sharp')) {
                return 'vendor-images';
              }
              
              // Database and caching
              if (id.includes('@supabase') || id.includes('@upstash') || id.includes('redis')) {
                return 'vendor-data';
              }
              
              // UI and animation libraries
              if (id.includes('framer-motion') || id.includes('@headlessui') || id.includes('lucide')) {
                return 'vendor-ui';
              }
              
              // All other vendor code
              return 'vendor-misc';
            }
            
            // Application code splitting
            if (id.includes('/src/components/')) {
              // Blog-specific components
              if (id.includes('/blog/')) {
                return 'components-blog';
              }
              // Interactive components with heavy logic
              if (id.includes('CommentSystem') || id.includes('AuthModal') || id.includes('GDPRConsent')) {
                return 'components-interactive';
              }
              // Common UI components
              return 'components-ui';
            }
            
            // Middleware and server code
            if (id.includes('/src/middleware/') || id.includes('/src/server/')) {
              return 'server-code';
            }
            
            // Utilities and shared code
            if (id.includes('/src/utils/') || id.includes('/src/lib/')) {
              return 'shared-utils';
            }
          },
          
          // Optimize chunk file names for caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '') 
              : 'unknown';
            return `chunks/[name]-[hash].js`;
          },
          
          // Optimize asset file names
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.').pop();
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff2?|eot|ttf|otf/i.test(extType)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        },
        
        // Tree-shaking optimizations
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
        
        // External dependencies optimization
        external: (id) => {
          // Keep heavy image processing external for SSR
          return ['sharp', '@resvg/resvg-js', 'canvas'].some(dep => id.includes(dep));
        }
      },
      
      // Advanced minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      
      // Target modern browsers for smaller bundles
      target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
      
      // Source map optimization
      sourcemap: process.env.NODE_ENV === 'development',
    },
    ssr: {
      // External dependencies that should not be bundled
      external: ['sharp', '@resvg/resvg-js'],
    },
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
    concurrency: 4, // Increase build parallelism
    assetsInlineLimit: 2048, // Inline more small assets
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
