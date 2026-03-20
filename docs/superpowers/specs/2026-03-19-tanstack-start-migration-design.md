# TanStack Start Migration Design

**Date:** 2026-03-19
**Status:** Approved
**Scope:** Full rewrite — Astro 5 SSR → TanStack Start + Cloudflare Workers

---

## Context

piyushmehta.com is a personal portfolio and blog site. CSS loading issues in the current Astro 5 setup prompted a full framework migration to TanStack Start, taking the opportunity to simplify the feature set and move to Cloudflare Workers for deployment.

**Migration type:** Full rewrite (not incremental)
**Deployment target:** Cloudflare Workers (replacing Vercel)
**Content format:** MDX (stays as-is, pipeline replaced)
**Scope:** Core pages only — blog, about, projects, contact, uses, videos + feeds

---

## What Is Dropped

Features cut from initial rewrite (can be added back later):

- Newsletter API (1099-line Upstash/rate-limit system)
- Dynamic OG image generation (Satori + @vercel/og)
- Pagefind static search
- PWA / offline page / service worker
- ISR caching (Vercel-specific)
- SEO landing pages: `/services`, `/resume`, `/react-developer`
- `/privacy-policy`, `/terms-of-service`

**Kept feeds** (RSS, sitemap, robots.txt) — implemented as TanStack Start loader routes returning `Response` with correct `Content-Type`. These are critical for existing RSS subscribers and search indexing.

---

## Stack

| Concern | Current (Astro 5) | New (TanStack Start) |
|---|---|---|
| Framework | Astro 5 SSR | TanStack Start (Vinxi/Vite) |
| UI | Astro + React islands | React (all components) |
| Styling | Tailwind 3 + CSS custom props | Same — unchanged |
| Content | Astro Content Collections | MDX + `gray-matter` + `@mdx-js/rollup` |
| Deployment | Vercel | Cloudflare Workers |
| Email | — | Resend |
| Search | Pagefind | Dropped |
| OG Images | Satori + @vercel/og | Static pre-generated PNGs |
| Monitoring | Sentry (`@sentry/node`) | `@sentry/cloudflare` |
| Rate Limiting | Upstash Redis | Cloudflare Rate Limiting binding |

---

## Pages In Scope

| Route | Priority | Notes |
|---|---|---|
| `/` | 1 | Homepage |
| `/about` | 1 | About |
| `/blog` | 1 | Blog listing |
| `/blog/$slug` | 1 | 20 MDX posts (some with interactive component imports) |
| `/projects` | 1 | Projects — live GitHub API fetch |
| `/contact-me` | 1 | Contact form (Resend) |
| `/uses` | 2 | Static page |
| `/videos` | 2 | Static page |
| `/rss.xml` | 1 | RSS feed — loader returning XML Response |
| `/sitemap.xml` | 1 | Sitemap — loader returning XML Response |
| `/robots.txt` | 1 | Robots — loader returning text Response |

---

## File Structure

```
src/
  routes/                   # TanStack Start file-based routing — thin shells only
    __root.tsx              # Root layout (replaces Layout.astro)
    index.tsx               # /
    about.tsx               # /about
    projects.tsx            # /projects
    contact-me.tsx          # /contact-me
    uses.tsx                # /uses
    videos.tsx              # /videos
    rss.xml.tsx             # /rss.xml — returns Response
    sitemap.xml.tsx         # /sitemap.xml — returns Response
    robots.txt.tsx          # /robots.txt — returns Response
    blog/
      index.tsx             # /blog
      $slug.tsx             # /blog/$slug
    api/
      contact.ts            # Server function — Resend email

  features/                 # Self-contained feature modules
    blog/
      components/
        BlogCard.tsx
        BlogList.tsx
        PostHeader.tsx
        PostBody.tsx        # Renders compiled MDX with component injection
        TagList.tsx
      lib/
        repository.ts       # MDX file reading + frontmatter parsing
        service.ts          # Business logic (filter drafts, sort, shape)
        schemas.ts          # Zod schemas for frontmatter validation
        index.ts            # Public API: getAllPosts(), getPost(slug)
        mdx-components.ts   # MDX component map (blog-specific React components)
      types.ts
    projects/
      components/
        ProjectCard.tsx
        ProjectList.tsx
      lib/
        github.ts           # GitHub API fetch (carried over from utils/github.ts)
        service.ts          # Merge live repos with fallback static list
      data/
        fallback.ts         # Static fallback project list (current hardcoded data)
    contact/
      components/
        ContactForm.tsx
      lib/
        service.ts          # Rate limit → validate → send
        repository.ts       # Resend API call only
        schemas.ts          # Zod schema for contact form input
    videos/
      components/
        VideoCard.tsx
      data/
        videos.ts
    feeds/
      lib/
        rss.ts              # RSS XML generation
        sitemap.ts          # Sitemap XML generation

  components/               # Shared across features
    layout/
      Nav.tsx               # Listens to 'themechange' CustomEvent
      Footer.tsx
    ui/
      Button.tsx
      Tag.tsx
    theme/
      ThemeSelector.tsx     # Dispatches 'themechange' CustomEvent
      ThemeToggle.tsx

  styles/                   # Carried over unchanged from current site
    global.css
    themes.css
    base.css
    components.css
    utilities.css

  lib/                      # Shared infrastructure
    env.ts                  # Zod-validated env vars (Cloudflare context-aware)
    theme.ts                # Theme init script string (injected into <head>)
    errors.ts               # Typed AppError hierarchy
    result.ts               # Result<T> type
    sentry.ts               # @sentry/cloudflare init

  content/
    blog/                   # MDX files — unchanged, stay in place
```

---

## Data Flow Architecture

### Four-layer model

```
Route (thin shell)
  └── Service (business logic + validation + rate limiting)
        └── Repository (data access only)
              └── Infrastructure (env, errors, rate limit, Resend)
```

Each layer has one responsibility. Routes never call repositories directly. Services never know about HTTP or Cloudflare bindings (those are injected as parameters).

### Typed error model

```ts
// src/lib/errors.ts
type AppError =
  | { type: 'validation'; fields: Record<string, string> }
  | { type: 'rate_limited'; retryAfter: number }
  | { type: 'not_found'; resource: string }
  | { type: 'internal' }   // never leaks internal details to client

// src/lib/result.ts
type Result<T> = { ok: true; data: T } | { ok: false; error: AppError }
```

---

## Blog Content Pipeline

### Build-time MDX compilation (required)

MDX must be compiled at **build time**, not at runtime. Four existing posts (`bloom-filters`, `migrating-legacy-codebase-to-astro`, and others) contain `import` statements for interactive React components (`BloomFilterDemo`, `TechComparison`, `InteractiveQuiz`). Client-side `evaluate()` from `@mdx-js/mdx` cannot resolve these module paths in a browser context — it will throw at runtime.

**Correct approach:** use `@mdx-js/rollup` as a Vite plugin. MDX files are compiled to JavaScript modules at build time. Component imports inside MDX resolve via Vite's module graph. Posts are imported via `import.meta.glob` with `eager: true`.

```ts
// app.config.ts (Vinxi config)
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig({
  vite: {
    plugins: [
      mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        rehypePlugins: [],
      }),
    ],
  },
})
```

```ts
// src/features/blog/lib/repository.ts
const modules = import.meta.glob('../../../content/blog/*/index.mdx', { eager: true })

// Each module has: default (React component), frontmatter (parsed by remark-mdx-frontmatter)
export function getAllPostModules(): PostModule[] {
  return Object.entries(modules).map(([path, mod]) => ({
    slug: extractSlug(path),
    Component: (mod as any).default,        // compiled MDX → React component
    frontmatter: (mod as any).frontmatter,  // parsed at build time
  }))
}
```

```tsx
// src/features/blog/components/PostBody.tsx
// The MDX component already has its imports resolved at build time.
// No runtime evaluate() needed.
export function PostBody({ Component }: { Component: React.ComponentType }) {
  return (
    <div className="prose">
      <Component />
    </div>
  )
}
```

**Frontmatter validation** — all posts validated at build time via Zod:
```ts
// src/features/blog/lib/schemas.ts
export const PostFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
})
// Called in repository.ts for every post — build fails if any post violates schema
```

---

## Projects — GitHub API

The projects page fetches live GitHub repositories at request time via the GitHub API (current `utils/github.ts`), then merges with a hardcoded fallback list. This live fetch is **kept** in the rewrite.

```ts
// src/features/projects/lib/service.ts
export async function getProjects(githubToken: string): Promise<Result<Project[]>> {
  try {
    const liveRepos = await fetchGitHubRepos('piyush97', githubToken)
    return { ok: true, data: mergeWithFallback(liveRepos, fallbackProjects) }
  } catch {
    // GitHub API failure is not fatal — serve fallback list
    return { ok: true, data: fallbackProjects }
  }
}
```

`GITHUB_TOKEN` must be added to the env schema and provided as a Cloudflare secret.

---

## Contact Form Security

1. Cloudflare Rate Limiting binding — 5 requests per 60s per IP
2. Zod validation on all input fields (name, email, message)
3. Honeypot field (`_hp`) — must be empty; silently discard if filled (no error, no send)
4. Internal errors mapped to `{ type: 'internal' }` — no details to client
5. Resend call isolated in repository layer

---

## Environment Variables

### Cloudflare Workers context — correct access pattern

Cloudflare Workers do **not** expose `process.env`. Bindings (env vars, secrets, KV, rate limiters) are passed as the `env` parameter of the `fetch` handler. In TanStack Start's Cloudflare adapter (Vinxi), they are accessible via the request context.

```ts
// src/lib/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_FROM_EMAIL: z.string().email(),
  CONTACT_TO_EMAIL: z.string().email(),
  GITHUB_TOKEN: z.string().min(1),
  SENTRY_DSN: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

// Validate at request time using the Cloudflare env object injected by the adapter
export function validateEnv(rawEnv: unknown): Env {
  return EnvSchema.parse(rawEnv)
}
```

In server functions and loaders, env is accessed via TanStack Start's server context:
```ts
// src/routes/api/contact.ts
const submitContactFn = createServerFn({ method: 'POST' })
  .handler(async ({ request, context }) => {
    const cfEnv = (context as any).cloudflare.env   // Cloudflare bindings object
    const env = validateEnv(cfEnv)
    const rateLimiter = cfEnv.RATE_LIMITER          // Rate limiting binding
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
    return submitContact(await request.json(), env, rateLimiter, ip)
  })
```

Secrets are set via:
```bash
wrangler secret put RESEND_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put SENTRY_DSN
```

---

## Cloudflare Deployment

### `wrangler.toml`

```toml
name = "piyushmehta-com"
main = ".output/server/index.mjs"
compatibility_date = "2025-11-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".output/public"

[[rules]]
type = "ESModule"
globs = ["**/*.mjs"]

# Cloudflare Rate Limiting API (graduated from unsafe.bindings)
[[rate_limiting]]
binding = "RATE_LIMITER"
namespace_id = "1"
simple = { limit = 5, period = 60 }

[vars]
CONTACT_FROM_EMAIL = "noreply@piyushmehta.com"
CONTACT_TO_EMAIL = "hello@piyushmehta.com"
```

Note: `[[unsafe.bindings]]` with `type = "ratelimit"` is the **beta-era syntax** — do not use it. The graduated syntax uses `[[rate_limiting]]` with a `binding` key.

### Security headers — `public/_headers`

Full production CSP carried over from `vercel.json`, adapted for Cloudflare (Vercel Analytics and Giscus removed — both are dropped features):

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' *.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: *.githubusercontent.com; font-src 'self'; connect-src 'self' *.sentry.io; frame-src 'none'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
```

### Build & deploy scripts

```json
{
  "dev": "vinxi dev",
  "build": "vinxi build --preset cloudflare-workers",
  "deploy": "wrangler deploy",
  "preview": "wrangler dev"
}
```

---

## Theme System — Three Variants

The site has **three themes**, not two. The CSS and ThemeSelector both implement:

| Theme name | Class on `<html>` | CSS selector |
|---|---|---|
| Dark (default) | `professional-dark` | `:root` (default) |
| Light | `professional-light` | `:root.professional-light` |
| High contrast | `high-contrast` | `:root.high-contrast` |

### Theme initialization script

Injected into `<head>` before any CSS loads (prevents flash of wrong theme):

```ts
// src/lib/theme.ts
export const themeInitScript = `
(function() {
  var t = localStorage.getItem('theme') || 'dark';
  var root = document.documentElement;
  root.classList.remove('professional-dark', 'professional-light', 'high-contrast', 'retro-tech', 'minimalist', 'custom-theme');
  if (t === 'dark') root.classList.add('professional-dark');
  else if (t === 'light') root.classList.add('professional-light');
  else if (t === 'high-contrast') root.classList.add('high-contrast');
  else root.classList.add('professional-dark');
})();
`
```

### ThemeSelector component — React migration

`ThemeSelector.astro` becomes `src/components/theme/ThemeSelector.tsx`. It dispatches a `themechange` CustomEvent that `Nav.tsx` listens to for reactivity. This event-based pattern is identical to the current implementation — no behavior change.

```tsx
// src/components/theme/ThemeSelector.tsx
function applyTheme(theme: 'dark' | 'light' | 'high-contrast') {
  const root = document.documentElement
  root.classList.remove('professional-dark', 'professional-light', 'high-contrast',
    'retro-tech', 'minimalist', 'custom-theme')
  if (theme === 'dark') root.classList.add('professional-dark')
  else if (theme === 'light') root.classList.add('professional-light')
  else root.classList.add('high-contrast')
  localStorage.setItem('theme', theme)
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
}
```

```tsx
// src/components/layout/Nav.tsx
useEffect(() => {
  const handler = (e: Event) => { /* update active theme indicator */ }
  document.addEventListener('themechange', handler)
  return () => document.removeEventListener('themechange', handler)
}, [])
```

---

## RSS, Sitemap, Robots

Implemented as TanStack Start loader routes returning a `Response` object:

```ts
// src/routes/rss.xml.tsx
export const Route = createFileRoute('/rss.xml')({
  loader: async () => {
    const posts = await listPosts()  // from blog service
    const xml = generateRss(posts.ok ? posts.data : [])
    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })
  },
})

// src/routes/robots.txt.tsx
export const Route = createFileRoute('/robots.txt')({
  loader: () => new Response(
    `User-agent: *\nAllow: /\nSitemap: https://piyushmehta.com/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  ),
})
```

---

## Component Migration

### What carries over unchanged

All existing `.tsx` React components copy directly — no conversion needed.

### `.astro` → `.tsx` conversion rules

| Astro | React/TSX |
|---|---|
| `class=` | `className=` |
| `Astro.props` | Typed function parameters |
| `<slot />` | `{ children }` prop |
| `set:html={x}` | `dangerouslySetInnerHTML={{ __html: x }}` |
| `<style>` block | CSS unchanged (same class names, move to global/module CSS) |
| `---` frontmatter | Remove — becomes imports + props |

### Root layout

`Layout.astro` becomes `src/routes/__root.tsx` using TanStack Start's `createRootRoute`. The theme initialization script is injected as `<script dangerouslySetInnerHTML={{ __html: themeInitScript }}>` in `<head>`, before stylesheet links, to prevent flash of wrong theme.

### Migration order

1. Project scaffolding — `package.json`, `app.config.ts` (Vinxi), Tailwind, Biome
2. `__root.tsx` — layout + theme init script
3. `Nav.tsx`, `Footer.tsx`, `ThemeSelector.tsx` — shared layout + theme system
4. Blog pipeline — `repository.ts`, `service.ts`, MDX Vite config, `BlogCard.tsx`
5. Homepage, About, Uses, Videos — static pages
6. Blog listing + post pages — content pipeline + PostBody with compiled MDX
7. Projects page — GitHub API integration, fallback data
8. Contact form + server function — Zod validation, rate limiting, Resend
9. RSS, sitemap, robots.txt — feed routes
10. Sentry, security headers, E2E test updates

---

## CSS Strategy

The entire CSS system carries over unchanged:
- `themes.css` — CSS custom property definitions for all three themes
- `base.css` — resets, typography
- `components.css` — card, button, tag styles
- `utilities.css` — responsive helpers
- `global.css` — imports all four

Class names are identical. The only change is `class=` → `className=` in JSX.

---

## Key Dependencies

**Add:**
- `@tanstack/start`
- `@tanstack/react-router`
- `vinxi`
- `@mdx-js/mdx`
- `@mdx-js/rollup`
- `remark-frontmatter`
- `remark-mdx-frontmatter`
- `gray-matter` (for non-Vite frontmatter parsing if needed)
- `resend`
- `@sentry/cloudflare`
- `wrangler`
- `zod`

**Remove:**
- `astro`
- `@astrojs/react`, `@astrojs/tailwind`, `@astrojs/mdx`, `@astrojs/sitemap`
- `@astrojs/vercel`
- `@vercel/og`
- `satori`
- `@upstash/redis`, `@upstash/ratelimit`
- All Astro integrations

**Keep:**
- `react`, `react-dom`
- `tailwindcss`
- `biome` (linting unchanged)
- `playwright` (E2E tests — update base URL only)
- `lefthook` (pre-commit hooks unchanged)
