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
**Scope:** Core pages only — blog, about, projects, contact, uses, videos

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

---

## Stack

| Concern | Current (Astro 5) | New (TanStack Start) |
|---|---|---|
| Framework | Astro 5 SSR | TanStack Start (Vinxi/Vite) |
| UI | Astro + React islands | React (all components) |
| Styling | Tailwind 3 + CSS custom props | Same — unchanged |
| Content | Astro Content Collections | MDX + `gray-matter` + Vite |
| Deployment | Vercel | Cloudflare Workers |
| Email | — | Resend |
| Search | Pagefind | Dropped |
| OG Images | Satori + @vercel/og | Static pre-generated PNGs |
| Monitoring | Sentry (`@sentry/node`) | `@sentry/cloudflare` |
| Rate Limiting | Upstash Redis | Cloudflare Rate Limiting binding |

---

## Pages In Scope

| Route | Priority |
|---|---|
| `/` | 1 — Homepage |
| `/about` | 1 — About |
| `/blog` | 1 — Blog listing |
| `/blog/[slug]` | 1 — 20 MDX posts |
| `/projects` | 1 — Projects |
| `/contact-me` | 1 — Contact form (real, via Resend) |
| `/uses` | 2 — Static page |
| `/videos` | 2 — Static page |

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
    blog/
      index.tsx             # /blog
      $slug.tsx             # /blog/[slug]
    api/
      contact.ts            # Server function — Resend email

  features/                 # Self-contained feature modules
    blog/
      components/
        BlogCard.tsx
        BlogList.tsx
        PostHeader.tsx
        PostBody.tsx
        TagList.tsx
      lib/
        repository.ts       # MDX file reading, frontmatter parsing
        service.ts          # Business logic (filter drafts, sort, shape)
        schemas.ts          # Zod schemas for frontmatter validation
        index.ts            # Public API: getAllPosts(), getPost(slug)
      types.ts
    projects/
      components/
        ProjectCard.tsx
        ProjectList.tsx
      data/
        projects.ts
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

  components/               # Shared across features
    layout/
      RootLayout.tsx
      Nav.tsx
      Footer.tsx
    ui/
      Button.tsx
      Tag.tsx
    seo/
      Meta.tsx
      JsonLd.tsx

  styles/                   # Carried over unchanged from current site
    global.css
    themes.css
    base.css
    components.css
    utilities.css

  lib/                      # Shared infrastructure
    env.ts                  # Zod-validated env vars, fail-fast at startup
    theme.ts                # Theme init script (injected into <head>)
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

Each layer has one responsibility. Routes never call repositories directly. Services never know about HTTP or Cloudflare bindings (those are injected).

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

### Blog content pipeline

- `import.meta.glob` reads all MDX files at build time (Vite)
- `gray-matter` parses frontmatter
- `PostFrontmatterSchema` (Zod) validates every post — build fails on invalid frontmatter
- `draft: true` posts filtered at service layer, never reachable via URL
- MDX rendered client-side via `@mdx-js/mdx` `evaluate()` in `$slug.tsx`

### Contact form security

1. Cloudflare Rate Limiting binding — 5 requests per 60s per IP
2. Zod validation on all input fields
3. Honeypot field (`_hp`) — must be empty; silently discard if filled
4. Internal errors mapped to `{ type: 'internal' }` — no details to client
5. Resend call isolated in repository layer

### Environment variables

```ts
// src/lib/env.ts — validated at startup via Zod, throws on missing required vars
const Env = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_FROM_EMAIL: z.string().email(),
  CONTACT_TO_EMAIL: z.string().email(),
  SENTRY_DSN: z.string().optional(),
})
export const env = Env.parse(process.env)
```

Secrets set via `wrangler secret put`, never in `wrangler.toml`.

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

[[unsafe.bindings]]
name = "RATE_LIMITER"
type = "ratelimit"
namespace_id = "1"
simple = { limit = 5, period = 60 }

[vars]
CONTACT_FROM_EMAIL = "noreply@piyushmehta.com"
CONTACT_TO_EMAIL = "hello@piyushmehta.com"
```

### Security headers — `public/_headers`

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'
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
| `<style>` block | CSS unchanged (same class names) |
| `---` frontmatter | Remove — becomes imports + props |

### Root layout

`Layout.astro` becomes `src/routes/__root.tsx` using TanStack Start's `createRootRoute`. The theme initialization inline script (reads `localStorage`, sets class on `<html>`) is injected as `<script dangerouslySetInnerHTML={{ __html: themeInitScript }}>` in `<head>`.

### Migration order

1. `__root.tsx` — layout + theme system
2. `Nav.tsx`, `Footer.tsx` — shared layout
3. Blog pipeline — `repository.ts`, `service.ts`, `BlogCard.tsx`
4. Homepage, About, Projects — static pages (fastest)
5. Blog listing + post pages — content pipeline
6. Contact form + server function — most complex

---

## CSS Strategy

The entire CSS system carries over unchanged:
- `themes.css` — CSS custom property theme definitions (dark/light/high-contrast)
- `base.css` — resets, typography
- `components.css` — card, button, tag styles
- `utilities.css` — responsive helpers
- `global.css` — imports all four

No Tailwind utility class changes needed. The same class names work in React JSX (with `className` instead of `class`).

---

## Key Dependencies

**Add:**
- `@tanstack/start`
- `@tanstack/react-router`
- `vinxi`
- `@mdx-js/mdx`
- `@mdx-js/rollup`
- `gray-matter`
- `resend`
- `@sentry/cloudflare`
- `wrangler`
- `zod` (already present if used)

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
- `@sentry/node` → replaced by `@sentry/cloudflare`
- `biome` (linting unchanged)
- `playwright` (E2E tests — update base URL only)
