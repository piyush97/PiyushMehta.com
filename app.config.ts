// app.config.ts
import { defineConfig } from '@tanstack/start/config'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig({
  server: {
    preset: 'cloudflare-module',
  },
  tsr: {
    appDirectory: './src',
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
  },
  routers: {
    client: {
      entry: './src/client.tsx',
    },
    ssr: {
      entry: './src/ssr.tsx',
    },
    server: {
      globalMiddlewareEntry: './src/global-middleware.ts',
    },
  },
  vite: {
    plugins: [
      mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
      // Provide virtual module aliases required by @tanstack/start-server-core
      {
        name: 'tanstack-virtual-entries',
        resolveId(id: string) {
          if (id === '#tanstack-router-entry') return '\0tanstack-router-entry'
          if (id === '#tanstack-start-entry') return '\0tanstack-start-entry'
          if (id === 'tanstack-start-manifest:v') return '\0tanstack-start-manifest'
          if (id === 'tanstack-start-injected-head-scripts:v') return '\0tanstack-start-injected-head-scripts'
          return null
        },
        load(id: string) {
          if (id === '\0tanstack-router-entry') {
            return `import { createRouter } from '/src/router.tsx'; export async function getRouter() { return createRouter(); }`
          }
          if (id === '\0tanstack-start-entry') {
            return `export const startInstance = undefined`
          }
          if (id === '\0tanstack-start-manifest') {
            return `export function tsrStartManifest() { return { routes: {}, clientEntry: '' } }`
          }
          if (id === '\0tanstack-start-injected-head-scripts') {
            return `export const injectedHeadScripts = undefined`
          }
          return null
        },
      },
    ],
    build: {
      rollupOptions: {
        external: ['node:async_hooks'],
      },
    },
  },
})
