# TanStack Start Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite piyushmehta.com from Astro 5 SSR to TanStack Start deployed on Cloudflare Workers, simplifying the feature set while preserving all core content and the existing CSS/theme system.

**Architecture:** Feature-based module structure with a four-layer data flow (route → service → repository → infrastructure). MDX compiled at build time via `@mdx-js/rollup`. Cloudflare Workers bindings replace Vercel-specific infrastructure.

**Tech Stack:** TanStack Start (Vinxi/Vite), React 18, Tailwind CSS 3, `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`, Resend, `@sentry/cloudflare`, Cloudflare Workers, Wrangler, Zod, Biome, Playwright

**Spec:** `docs/superpowers/specs/2026-03-19-tanstack-start-migration-design.md`

---

## Pre-flight: Create Isolation Branch

```bash
cd /home/piyushmehta/Projects/Personal/piyushmehta.com-new
git checkout -b tanstack-migration
```

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Rewrite | New deps — remove Astro, add TanStack/Vinxi/Wrangler |
| `app.config.ts` | Create | Vinxi config with Cloudflare preset + MDX Vite plugin |
| `tsconfig.json` | Modify | Update for TanStack Start paths |
| `tailwind.config.mjs` | Modify | Update `content` globs (remove `.astro`) |
| `biome.json` | Modify | Remove Astro-specific overrides |
| `wrangler.toml` | Create | Cloudflare Workers deployment config |
| `public/_headers` | Create | Security headers (full production CSP) |
| `src/lib/env.ts` | Create | Zod-validated Cloudflare env access |
| `src/lib/errors.ts` | Create | Typed `AppError` discriminated union |
| `src/lib/result.ts` | Create | `Result<T>` type |
| `src/lib/theme.ts` | Create | Theme init script string |
| `src/lib/sentry.ts` | Create | `@sentry/cloudflare` init helper |
| `src/routes/__root.tsx` | Create | Root layout — replaces `Layout.astro` |
| `src/components/layout/Nav.tsx` | Create | Navbar — listens to `themechange` event |
| `src/components/layout/Footer.tsx` | Create | Footer |
| `src/components/theme/ThemeSelector.tsx` | Create | 3-theme selector — dispatches `themechange` |
| `src/components/ui/Button.tsx` | Create | Shared button primitive |
| `src/components/ui/Tag.tsx` | Create | Shared tag primitive |
| `src/features/blog/types.ts` | Create | `Post` interface |
| `src/features/blog/lib/schemas.ts` | Create | Zod frontmatter schema |
| `src/features/blog/lib/repository.ts` | Create | `import.meta.glob` + frontmatter parsing |
| `src/features/blog/lib/service.ts` | Create | Filter drafts, sort, shape |
| `src/features/blog/lib/index.ts` | Create | Public API: `getAllPosts()`, `getPost(slug)` |
| `src/features/blog/components/BlogCard.tsx` | Create | Blog post card |
| `src/features/blog/components/BlogList.tsx` | Create | Blog listing grid |
| `src/features/blog/components/PostHeader.tsx` | Create | Post title/meta |
| `src/features/blog/components/PostBody.tsx` | Create | Renders compiled MDX component |
| `src/features/blog/components/TagList.tsx` | Create | Tag pills |
| `src/features/projects/types.ts` | Create | `Project` interface |
| `src/features/projects/data/fallback.ts` | Create | Static fallback project list |
| `src/features/projects/lib/github.ts` | Create | GitHub API (fixed — no `import.meta.env`) |
| `src/features/projects/lib/service.ts` | Create | Merge live repos + fallback |
| `src/features/projects/components/ProjectCard.tsx` | Create | Project card |
| `src/features/projects/components/ProjectList.tsx` | Create | Project grid |
| `src/features/contact/lib/schemas.ts` | Create | Zod contact form schema with honeypot |
| `src/features/contact/lib/repository.ts` | Create | Resend API call |
| `src/features/contact/lib/service.ts` | Create | Rate limit → validate → send |
| `src/features/contact/components/ContactForm.tsx` | Create | Contact form UI |
| `src/features/videos/data/videos.ts` | Create | Static video list |
| `src/features/videos/components/VideoCard.tsx` | Create | Video card |
| `src/features/feeds/lib/rss.ts` | Create | RSS XML generation |
| `src/features/feeds/lib/sitemap.ts` | Create | Sitemap XML generation |
| `src/routes/index.tsx` | Create | Homepage |
| `src/routes/about.tsx` | Create | About page |
| `src/routes/projects.tsx` | Create | Projects page |
| `src/routes/uses.tsx` | Create | Uses page |
| `src/routes/videos.tsx` | Create | Videos page |
| `src/routes/contact-me.tsx` | Create | Contact page |
| `src/routes/blog/index.tsx` | Create | Blog listing |
| `src/routes/blog/$slug.tsx` | Create | Blog post |
| `src/routes/api/contact.ts` | Create | Contact form server function |
| `src/routes/api/rss[.]xml.ts` | Create | RSS feed — served at `/rss.xml` |
| `src/routes/api/sitemap[.]xml.ts` | Create | Sitemap — served at `/sitemap.xml` |
| `src/routes/api/robots[.]txt.ts` | Create | Robots — served at `/robots.txt` |
| `playwright.config.ts` | Modify | Update ports for Vinxi dev server |

---

## Phase 0 — Pre-migration Content Cleanup

**Must be done before the new build system is in place. These MDX files contain Astro-specific syntax that will break `@mdx-js/rollup`.**

### Task 0: Fix MDX Content

**Files:**
- Move: `src/content/blog/macos-to-arch-linux-omarchy-developer-productivity.mdx` → `src/content/blog/macos-to-arch-linux-omarchy-developer-productivity/index.mdx`
- Modify: `src/content/blog/bloom-filters/index.mdx` (lines 47, 90, 139)
- Modify: `src/content/blog/macos-to-arch-linux-omarchy-developer-productivity/index.mdx` (lines 71, 320)
- Modify: `src/content/blog/zero-downtime-database-migration-at-scale/index.mdx` (lines 89, 99, 329, 431)

**Why:** `client:load` and `client:visible` are Astro-specific JSX attributes. They are not valid React props. When `@mdx-js/rollup` compiles these files, TypeScript will error on unknown props. The fix is to remove the attribute — React components render immediately without lazy hydration directives.

**Note on `migrating-legacy-codebase-to-astro`:** That post uses `client:*` in code block examples (backtick fences), not as actual component usage in the document body. Grep matches inside code fences are false positives — no changes needed to that file.

- [ ] **Step 1: Move the loose top-level MDX file into a subdirectory**

```bash
mkdir -p src/content/blog/macos-to-arch-linux-omarchy-developer-productivity
mv src/content/blog/macos-to-arch-linux-omarchy-developer-productivity.mdx \
   src/content/blog/macos-to-arch-linux-omarchy-developer-productivity/index.mdx
```

- [ ] **Step 2: Strip `client:load` from `bloom-filters/index.mdx`**

```bash
sed -i 's/ client:load//g; s/ client:visible//g; s/ client:idle//g' \
  src/content/blog/bloom-filters/index.mdx
```

Verify the three affected lines now read:
```mdx
<BloomFilterDemo />
<TechComparison />
<InteractiveQuiz />
```

- [ ] **Step 3: Strip `client:*` from `macos-to-arch-linux-omarchy-developer-productivity/index.mdx`**

```bash
sed -i 's/ client:load//g; s/ client:visible//g; s/ client:idle//g' \
  src/content/blog/macos-to-arch-linux-omarchy-developer-productivity/index.mdx
```

Verify lines 71 and 320 now read:
```mdx
<SetupShowcase />
<SystemComparison macosData={costData.macosData} archData={costData.archData} />
```

- [ ] **Step 4: Strip `client:load` from `zero-downtime-database-migration-at-scale/index.mdx`**

```bash
sed -i 's/ client:load//g; s/ client:visible//g; s/ client:idle//g' \
  src/content/blog/zero-downtime-database-migration-at-scale/index.mdx
```

Verify four lines now have no `client:*` attribute.

- [ ] **Step 5: Confirm no `client:*` remain in actual MDX component usage**

```bash
grep -rn "client:load\|client:visible\|client:idle" src/content/blog/ \
  --include="*.mdx" | grep -v "^\`\`\`\|^    \|^  \`"
```

Expected: No output (any remaining matches are inside code blocks).

- [ ] **Step 6: Commit**

```bash
git add src/content/blog/
git commit -m "fix: restructure loose MDX file, strip Astro client: directives from posts"
```

---

## Phase 1 — Foundation

### Task 1: Project Scaffolding

**Files:**
- Modify: `package.json`
- Create: `app.config.ts`
- Modify: `tsconfig.json`
- Modify: `tailwind.config.mjs`
- Modify: `biome.json`
- Create: `wrangler.toml`

- [ ] **Step 1: Remove Astro packages, install TanStack Start**

```bash
pnpm remove astro @astrojs/react @astrojs/tailwind @astrojs/mdx @astrojs/sitemap @astrojs/vercel @vercel/og satori @upstash/redis @upstash/ratelimit
pnpm add @tanstack/start @tanstack/react-router vinxi
pnpm add @mdx-js/mdx @mdx-js/rollup remark-frontmatter remark-mdx-frontmatter
pnpm add resend @sentry/cloudflare zod
pnpm add -D wrangler @cloudflare/workers-types
```

Note: Do NOT add `gray-matter` — it is unused. Frontmatter is handled at build time by `remark-mdx-frontmatter`.

- [ ] **Step 2: Create `app.config.ts`**

```ts
// app.config.ts
import { defineConfig } from '@tanstack/start/config'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig({
  server: {
    preset: 'cloudflare-workers',
  },
  vite: {
    plugins: [
      mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    ],
  },
})
```

Note: No unused imports. The `preset: 'cloudflare-workers'` string is the correct way to set the Vinxi preset.

- [ ] **Step 3: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build --preset cloudflare-workers",
    "preview": "wrangler dev",
    "deploy": "wrangler deploy",
    "lint": "biome lint src/",
    "lint:fix": "biome lint --write src/",
    "check": "biome check src/",
    "check:write": "biome check --write src/",
    "ci": "biome ci src/",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  }
}
```

The `--preset cloudflare-workers` flag is required on the build script — without it, Vinxi outputs a Node.js bundle incompatible with Cloudflare Workers.

- [ ] **Step 4: Update `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/content/*": ["./src/content/*"]
    }
  },
  "include": ["src", "app.config.ts"],
  "exclude": ["node_modules", "dist", ".output"]
}
```

- [ ] **Step 5: Update `tailwind.config.mjs` content globs**

Replace the `content` array value:
```js
content: ['./src/**/*.{html,js,jsx,ts,tsx,mdx}'],
```
Remove `.astro` — it no longer exists in the project.

- [ ] **Step 6: Update `biome.json`**

Remove all `.astro` references. Specifically:
1. In `files.ignore`: replace `.astro/**` with `.output/**`
2. In `formatter.include`: remove `"src/**/*.{js,jsx,ts,tsx,astro,json,jsonc}"` — replace with `"src/**/*.{js,jsx,ts,tsx,json,jsonc}"`
3. In `formatter.ignore` and `organizeImports.ignore`: replace `**/.astro/**` with `**/.output/**`
4. Delete the two `overrides` blocks whose `include` patterns reference `**/*.astro` or `src/pages/**/*.astro`

- [ ] **Step 7: Create `wrangler.toml`**

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

# Cloudflare Rate Limiting API (stable — NOT [[unsafe.bindings]])
# See: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
[[rate_limiting]]
binding = "RATE_LIMITER"
namespace_id = "1"
simple = { limit = 5, period = 60 }

[vars]
CONTACT_FROM_EMAIL = "noreply@piyushmehta.com"
CONTACT_TO_EMAIL = "hello@piyushmehta.com"
```

IMPORTANT: Use `[[rate_limiting]]` with `binding =`, NOT `[[unsafe.bindings]]` with `type = "ratelimit"`. The unsafe syntax is beta-era and deprecated.

- [ ] **Step 8: Create minimal bootstrap to verify build**

Create `src/routes/__root.tsx` (placeholder — will be rewritten in Task 4):
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
export const Route = createRootRoute({ component: () => <Outlet /> })
```

Create `src/routes/index.tsx` (placeholder):
```tsx
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({ component: () => <div>Hello</div> })
```

- [ ] **Step 9: Verify build**

```bash
pnpm build
```
Expected: Build completes, `.output/` directory created containing `server/index.mjs`.

- [ ] **Step 10: Commit**

```bash
git add package.json app.config.ts tsconfig.json tailwind.config.mjs biome.json wrangler.toml src/routes/__root.tsx src/routes/index.tsx
git commit -m "chore: scaffold TanStack Start + Cloudflare Workers project"
```

---

### Task 2: Infrastructure Layer

**Files:**
- Create: `src/lib/result.ts`
- Create: `src/lib/errors.ts`
- Create: `src/lib/env.ts`

- [ ] **Step 1: Create `src/lib/errors.ts`**

```ts
// src/lib/errors.ts
export type AppError =
  | { type: 'validation'; fields: Record<string, string> }
  | { type: 'rate_limited'; retryAfter: number }
  | { type: 'not_found'; resource: string }
  | { type: 'internal' }

export function internalError(): AppError { return { type: 'internal' } }
export function notFoundError(resource: string): AppError { return { type: 'not_found', resource } }
export function validationError(fields: Record<string, string>): AppError { return { type: 'validation', fields } }
export function rateLimitedError(retryAfter = 60): AppError { return { type: 'rate_limited', retryAfter } }
```

- [ ] **Step 2: Create `src/lib/result.ts`**

```ts
// src/lib/result.ts
import type { AppError } from './errors'

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError }

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

// Returns { ok: false; error: AppError } — not parameterized, avoids Result<never>
export function err(error: AppError): { ok: false; error: AppError } {
  return { ok: false, error }
}
```

Note: `err()` returns `{ ok: false; error: AppError }` (not `Result<never>`) so it is assignable to `Result<T>` for any `T` in TypeScript's structural type system.

- [ ] **Step 3: Create `src/lib/env.ts`**

```ts
// src/lib/env.ts
// Cloudflare Workers do NOT use process.env.
// Env vars are passed as the `env` object in the fetch handler.
// In TanStack Start's Cloudflare adapter, access via: (context as any).cloudflare.env
import { z } from 'zod'

const EnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_FROM_EMAIL: z.string().email(),
  CONTACT_TO_EMAIL: z.string().email(),
  GITHUB_TOKEN: z.string().min(1),
  SENTRY_DSN: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

// Throws ZodError if any required variable is missing — fail fast at request time
export function validateEnv(rawEnv: unknown): Env {
  return EnvSchema.parse(rawEnv)
}
```

- [ ] **Step 4: Run biome check**

```bash
pnpm check src/lib/
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add infrastructure layer — result type, error types, env validation"
```

---

### Task 3: Security Headers + CSS

**Files:**
- Create: `public/_headers`
- Verify: CSS files exist at `src/styles/`

- [ ] **Step 1: Create `public/_headers`**

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' *.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: *.githubusercontent.com; font-src 'self'; connect-src 'self' *.sentry.io; frame-src 'none'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';

/*.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=3600

/robots.txt
  Content-Type: text/plain

/*.js
  Cache-Control: public, immutable, max-age=31536000

/*.css
  Cache-Control: public, immutable, max-age=31536000

/*.woff2
  Cache-Control: public, immutable, max-age=31536000
```

- [ ] **Step 2: Verify CSS files are in place**

```bash
ls src/styles/
```
Expected: `global.css  themes.css  base.css  components.css  utilities.css`

These carry over unchanged — no modifications needed.

- [ ] **Step 3: Build verify**

```bash
pnpm build
```
Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add public/_headers
git commit -m "feat: add Cloudflare security headers and cache rules"
```

---

### Task 4: Root Layout + Theme System

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/lib/sentry.ts`
- Rewrite: `src/routes/__root.tsx`
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/theme/ThemeSelector.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Tag.tsx`

- [ ] **Step 1: Create `src/lib/theme.ts`**

```ts
// src/lib/theme.ts
// Runs before CSS loads to prevent flash of wrong theme.
// Injected as a raw <script> in __root.tsx <head>.
export const themeInitScript = `(function(){var t=localStorage.getItem('theme')||'dark';var r=document.documentElement;r.classList.remove('professional-dark','professional-light','high-contrast','retro-tech','minimalist','custom-theme','light');if(t==='dark')r.classList.add('professional-dark');else if(t==='light')r.classList.add('professional-light');else if(t==='high-contrast')r.classList.add('high-contrast');else r.classList.add('professional-dark');})();`
```

- [ ] **Step 2: Create `src/lib/sentry.ts`**

```ts
// src/lib/sentry.ts
// @sentry/cloudflare uses withSentry() to wrap the Worker fetch handler.
// Do NOT call Sentry.init() on each request — it is called once at the entry point.
// This module exports a helper to get the DSN from context.
export function getSentryDsn(cfEnv: Record<string, unknown>): string | undefined {
  return typeof cfEnv.SENTRY_DSN === 'string' ? cfEnv.SENTRY_DSN : undefined
}
```

- [ ] **Step 3: Create `src/components/theme/ThemeSelector.tsx`**

```tsx
// src/components/theme/ThemeSelector.tsx
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'high-contrast'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove(
    'professional-dark', 'professional-light', 'high-contrast',
    'retro-tech', 'minimalist', 'custom-theme', 'light'
  )
  if (theme === 'dark') root.classList.add('professional-dark')
  else if (theme === 'light') root.classList.add('professional-light')
  else root.classList.add('high-contrast')
  localStorage.setItem('theme', theme)
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
}

function getCurrentTheme(): Theme {
  const root = document.documentElement
  if (root.classList.contains('professional-light') || root.classList.contains('light')) return 'light'
  if (root.classList.contains('high-contrast')) return 'high-contrast'
  return 'dark'
}

export function ThemeSelector() {
  const [current, setCurrent] = useState<Theme>('dark')

  useEffect(() => {
    setCurrent(getCurrentTheme())
    const handler = (e: Event) => setCurrent((e as CustomEvent<{ theme: Theme }>).detail.theme)
    document.addEventListener('themechange', handler)
    return () => document.removeEventListener('themechange', handler)
  }, [])

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Dark', icon: '◐' },
    { value: 'light', label: 'Light', icon: '○' },
    { value: 'high-contrast', label: 'High contrast', icon: '●' },
  ]

  return (
    <div className="theme-selector" role="group" aria-label="Select theme">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          className={`theme-opt${current === value ? ' active' : ''}`}
          onClick={() => applyTheme(value)}
          aria-pressed={current === value}
          aria-label={label}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/layout/Nav.tsx`**

Carry over navbar content from `src/components/Navbar.astro`. Convert `class=` → `className=`. Import `ThemeSelector`. All CSS class names are identical.

```tsx
// src/components/layout/Nav.tsx
import { ThemeSelector } from '../theme/ThemeSelector'

const links = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/videos', label: 'Videos' },
  { href: '/about', label: 'About' },
  { href: '/contact-me', label: 'Contact' },
]

export function Nav() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container-base navbar-inner">
        <a href="/" className="navbar-brand" aria-label="Piyush Mehta — Home">
          <span className="brand-name">PM</span>
        </a>
        <div className="navbar-links">
          {links.map(({ href, label }) => (
            <a key={href} href={href} className="nav-link">
              {label}
            </a>
          ))}
        </div>
        <ThemeSelector />
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: Create `src/components/layout/Footer.tsx`**

Carry over content from `src/components/Footer.astro`. Convert `class=` → `className=`. Keep all links and copy.

- [ ] **Step 6: Create shared UI primitives**

```tsx
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button type="button" className={`btn-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
```

```tsx
// src/components/ui/Tag.tsx
export function Tag({ label }: { label: string }) {
  return <span className="project-tag">{label}</span>
}
```

- [ ] **Step 7: Rewrite `src/routes/__root.tsx`**

Note on imports: `HeadContent` and `Scripts` come from `@tanstack/start` (the full-stack package), not from `@tanstack/react-router`. Verify these exports exist in the installed version before committing.

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { HeadContent, Scripts } from '@tanstack/start'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { themeInitScript } from '../lib/theme'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [
      { rel: 'stylesheet', href: '/styles/global.css' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Nav />
        <main id="main-content">
          <Outlet />
        </main>
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Build verify**

```bash
pnpm build
```
Expected: Build completes without errors.

- [ ] **Step 9: Commit**

```bash
git add src/routes/__root.tsx src/components/ src/lib/theme.ts src/lib/sentry.ts
git commit -m "feat: add root layout, nav, footer, theme system (3 themes: dark/light/high-contrast)"
```

---

## Phase 2 — Content Pipeline + Static Pages

### Task 5: Blog Content Pipeline

**Files:**
- Create: `src/features/blog/types.ts`
- Create: `src/features/blog/lib/schemas.ts`
- Create: `src/features/blog/lib/repository.ts`
- Create: `src/features/blog/lib/service.ts`
- Create: `src/features/blog/lib/index.ts`

- [ ] **Step 1: Create `src/features/blog/types.ts`**

```ts
// src/features/blog/types.ts
import type { ComponentType } from 'react'

export interface PostFrontmatter {
  title: string
  description: string
  date: Date
  tags: string[]
  draft: boolean
  image?: { url: string; alt: string }
}

export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  Component: ComponentType
}
```

- [ ] **Step 2: Create `src/features/blog/lib/schemas.ts`**

```ts
// src/features/blog/lib/schemas.ts
import { z } from 'zod'

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  image: z.object({ url: z.string(), alt: z.string() }).optional(),
})

export function validateFrontmatter(raw: unknown, slug: string) {
  const result = PostFrontmatterSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Invalid frontmatter in blog/${slug}: ${result.error.message}`)
  }
  return result.data
}
```

- [ ] **Step 3: Create `src/features/blog/lib/repository.ts`**

```ts
// src/features/blog/lib/repository.ts
// @mdx-js/rollup compiles ALL MDX files at build time.
// remark-mdx-frontmatter exports frontmatter as a named 'frontmatter' export.
// The glob matches both subdirectory posts (*/index.mdx) and any loose top-level .mdx files.
import type { ComponentType } from 'react'
import { validateFrontmatter } from './schemas'
import type { Post } from '../types'

const modules = import.meta.glob<{
  default: ComponentType
  frontmatter: Record<string, unknown>
}>(
  [
    '../../../content/blog/*/index.mdx',
    '../../../content/blog/*.mdx',
  ],
  { eager: true }
)

function extractSlug(path: string): string {
  // ../../../content/blog/my-post/index.mdx → my-post
  // ../../../content/blog/my-post.mdx → my-post
  const withDir = path.match(/\/blog\/([^/]+)\/index\.mdx$/)
  if (withDir) return withDir[1]
  const loose = path.match(/\/blog\/([^/]+)\.mdx$/)
  return loose?.[1] ?? path
}

export function getAllPostModules(): Post[] {
  return Object.entries(modules).map(([path, mod]) => {
    const slug = extractSlug(path)
    const frontmatter = validateFrontmatter(mod.frontmatter, slug)
    return { slug, frontmatter, Component: mod.default }
  })
}
```

- [ ] **Step 4: Create `src/features/blog/lib/service.ts`**

```ts
// src/features/blog/lib/service.ts
import { getAllPostModules } from './repository'
import { ok, err } from '../../../lib/result'
import { notFoundError } from '../../../lib/errors'
import type { Result } from '../../../lib/result'
import type { Post } from '../types'

export function listPosts(): Result<Post[]> {
  const posts = getAllPostModules()
    .filter((p) => !p.frontmatter.draft)
    .sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime())
  return ok(posts)
}

export function findPost(slug: string): Result<Post> {
  const post = getAllPostModules().find((p) => p.slug === slug && !p.frontmatter.draft)
  if (!post) return err(notFoundError(`blog/${slug}`))
  return ok(post)
}
```

- [ ] **Step 5: Create `src/features/blog/lib/index.ts`**

```ts
// src/features/blog/lib/index.ts
export { listPosts, findPost } from './service'
export type { Post } from '../types'
```

- [ ] **Step 6: Build verify — all 21 posts must compile**

```bash
pnpm build 2>&1 | grep -iE "error|fail|blog"
```
Expected: No errors. 21 posts (including the moved `macos-to-arch-linux` post) must all compile.

- [ ] **Step 7: Commit**

```bash
git add src/features/blog/
git commit -m "feat: add blog content pipeline — build-time MDX compilation with Zod validation"
```

---

### Task 6: Blog Components

**Files:**
- Create: `src/features/blog/components/TagList.tsx`
- Create: `src/features/blog/components/BlogCard.tsx`
- Create: `src/features/blog/components/BlogList.tsx`
- Create: `src/features/blog/components/PostHeader.tsx`
- Create: `src/features/blog/components/PostBody.tsx`

- [ ] **Step 1: Create `src/features/blog/components/TagList.tsx`**

```tsx
// src/features/blog/components/TagList.tsx
interface Props { tags: string[] }
export function TagList({ tags }: Props) {
  return (
    <div className="project-tags">
      {tags.map((tag) => <span key={tag} className="project-tag">{tag}</span>)}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/features/blog/components/BlogCard.tsx`**

Carry over from `src/components/BlogCard.astro`, converting to React TSX. Replace `class=` with `className=`. All CSS class names are identical.

```tsx
// src/features/blog/components/BlogCard.tsx
import type { Post } from '../types'
import { TagList } from './TagList'

interface Props { post: Post }

export function BlogCard({ post }: Props) {
  const { slug, frontmatter } = post
  const formattedDate = frontmatter.date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <article className="blog-card">
      <a href={`/blog/${slug}`} className="blog-card-link">
        <div className="blog-card-content">
          <time dateTime={frontmatter.date.toISOString()} className="blog-card-date">
            {formattedDate}
          </time>
          <h2 className="blog-card-title">{frontmatter.title}</h2>
          <p className="blog-card-description">{frontmatter.description}</p>
          <TagList tags={frontmatter.tags} />
        </div>
      </a>
    </article>
  )
}
```

- [ ] **Step 3: Create `src/features/blog/components/BlogList.tsx`**

```tsx
// src/features/blog/components/BlogList.tsx
import type { Post } from '../types'
import { BlogCard } from './BlogCard'

interface Props { posts: Post[] }
export function BlogList({ posts }: Props) {
  if (posts.length === 0) return <p className="blog-empty">No posts yet.</p>
  return (
    <div className="blog-grid">
      {posts.map((post) => <BlogCard key={post.slug} post={post} />)}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/features/blog/components/PostHeader.tsx`**

```tsx
// src/features/blog/components/PostHeader.tsx
import type { PostFrontmatter } from '../types'
import { TagList } from './TagList'

interface Props { frontmatter: PostFrontmatter }
export function PostHeader({ frontmatter }: Props) {
  return (
    <header className="post-header">
      <time dateTime={frontmatter.date.toISOString()} className="post-date">
        {frontmatter.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      <h1 className="post-title">{frontmatter.title}</h1>
      <p className="post-description">{frontmatter.description}</p>
      <TagList tags={frontmatter.tags} />
    </header>
  )
}
```

- [ ] **Step 5: Create `src/features/blog/components/PostBody.tsx`**

```tsx
// src/features/blog/components/PostBody.tsx
// MDX is compiled at build time by @mdx-js/rollup.
// The Component is a standard React component — render it directly.
// No client-side evaluate() — all imports (including interactive components) are resolved by Vite.
import type { ComponentType } from 'react'

interface Props { Component: ComponentType }
export function PostBody({ Component }: Props) {
  return <div className="prose"><Component /></div>
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/blog/components/
git commit -m "feat: add blog UI components — BlogCard, BlogList, PostHeader, PostBody, TagList"
```

---

### Task 7: Static Pages

**Files:**
- Rewrite: `src/routes/index.tsx`
- Create: `src/routes/about.tsx`
- Create: `src/routes/uses.tsx`
- Create: `src/routes/videos.tsx`
- Create: `src/features/videos/data/videos.ts`
- Create: `src/features/videos/components/VideoCard.tsx`

- [ ] **Step 1: Rewrite `src/routes/index.tsx`**

Copy the full content of `src/pages/index.astro`. Remove the `---` frontmatter delimiters and imports. Convert all `class=` to `className=`. Wrap in a `createFileRoute` component. Keep all section content and CSS class names identical.

The component structure should be:
```tsx
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Piyush Mehta — Senior Software Engineer' },
      { name: 'description', content: 'Senior Software Engineer based in Canada. Expert in React, Node.js, TypeScript, and distributed systems.' },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      {/* Copy all section JSX from src/pages/index.astro here, with class → className */}
    </>
  )
}
```

Completion criterion: `pnpm dev` → homepage at `http://localhost:3000` renders the hero section with the correct heading text.

- [ ] **Step 2: Create `src/routes/about.tsx`**

Same pattern as index. Carry over all content from `src/pages/about.astro`. Convert `class=` → `className=`.

Completion criterion: `http://localhost:3000/about` renders the "About Me" heading and all six "What I Do" activity cards.

- [ ] **Step 3: Create `src/routes/uses.tsx`**

Same pattern. Carry over from `src/pages/uses.astro`.

- [ ] **Step 4: Extract video data to `src/features/videos/data/videos.ts`**

Open `src/pages/videos.astro` and find the video array. Copy it to a typed data file:

```ts
// src/features/videos/data/videos.ts
export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  date: string
  duration?: string
  tags: string[]
}

export const videos: Video[] = [
  // paste the video objects from src/pages/videos.astro
]
```

- [ ] **Step 5: Create `src/features/videos/components/VideoCard.tsx`**

```tsx
// src/features/videos/components/VideoCard.tsx
import type { Video } from '../data/videos'

interface Props { video: Video }
export function VideoCard({ video }: Props) {
  return (
    <article className="video-card">
      <a href={video.url} target="_blank" rel="noopener noreferrer">
        <img src={video.thumbnail} alt={video.title} className="video-thumbnail" loading="lazy" />
        <div className="video-content">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-description">{video.description}</p>
        </div>
      </a>
    </article>
  )
}
```

- [ ] **Step 6: Create `src/routes/videos.tsx`**

```tsx
// src/routes/videos.tsx
import { createFileRoute } from '@tanstack/react-router'
import { videos } from '../features/videos/data/videos'
import { VideoCard } from '../features/videos/components/VideoCard'

export const Route = createFileRoute('/videos')({
  head: () => ({ meta: [{ title: 'Videos — Piyush Mehta' }] }),
  component: VideosPage,
})

function VideosPage() {
  return (
    <div className="container-base">
      <h1>Videos</h1>
      <div className="videos-grid">
        {videos.map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Build verify**

```bash
pnpm build
```
Expected: All static pages compile without errors.

- [ ] **Step 8: Commit**

```bash
git add src/routes/index.tsx src/routes/about.tsx src/routes/uses.tsx src/routes/videos.tsx src/features/videos/
git commit -m "feat: add static pages — homepage, about, uses, videos"
```

---

### Task 8: Blog Routes

**Files:**
- Create: `src/routes/blog/index.tsx`
- Create: `src/routes/blog/$slug.tsx`

- [ ] **Step 1: Create `src/routes/blog/index.tsx`**

```tsx
// src/routes/blog/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { listPosts } from '../../features/blog/lib'
import { BlogList } from '../../features/blog/components/BlogList'

export const Route = createFileRoute('/blog/')({
  loader: () => {
    const result = listPosts()
    if (!result.ok) throw new Error('Failed to load posts')
    return result.data
  },
  head: () => ({
    meta: [
      { title: 'Blog — Piyush Mehta' },
      { name: 'description', content: 'Technical articles on software engineering, distributed systems, and web development.' },
    ],
  }),
  component: BlogPage,
})

function BlogPage() {
  const posts = Route.useLoaderData()
  return (
    <div className="container-base">
      <header className="blog-header">
        <h1 className="blog-title">Blog</h1>
        <p className="blog-subtitle">Technical writing on software engineering.</p>
      </header>
      <BlogList posts={posts} />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/routes/blog/$slug.tsx`**

```tsx
// src/routes/blog/$slug.tsx
import { createFileRoute, notFound } from '@tanstack/react-router'
import { findPost } from '../../features/blog/lib'
import { PostHeader } from '../../features/blog/components/PostHeader'
import { PostBody } from '../../features/blog/components/PostBody'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const result = findPost(params.slug)
    if (!result.ok) throw notFound()
    return result.data
  },
  head: ({ loaderData: post }) => ({
    meta: post ? [
      { title: `${post.frontmatter.title} — Piyush Mehta` },
      { name: 'description', content: post.frontmatter.description },
      { property: 'og:title', content: post.frontmatter.title },
      { property: 'og:description', content: post.frontmatter.description },
    ] : [],
  }),
  notFoundComponent: () => (
    <div className="container-base">
      <h1>Post not found</h1>
      <a href="/blog">← Back to blog</a>
    </div>
  ),
  component: BlogPostPage,
})

function BlogPostPage() {
  const post = Route.useLoaderData()
  return (
    <article className="container-base post-container">
      <a href="/blog" className="post-back-link">← Blog</a>
      <PostHeader frontmatter={post.frontmatter} />
      <PostBody Component={post.Component} />
    </article>
  )
}
```

- [ ] **Step 3: Build verify — all 21 posts must compile**

```bash
pnpm build 2>&1 | tail -10
```
Expected: `Build complete` with no errors.

- [ ] **Step 4: Start dev server and verify interactive MDX post**

```bash
pnpm dev
```
Open `http://localhost:3000/blog/bloom-filters`. Verify:
- Page renders with title "Bloom Filters..."
- `BloomFilterDemo`, `TechComparison`, `InteractiveQuiz` components render (no `client:load` attributes remain)
- No React prop warnings in browser console

- [ ] **Step 5: Commit**

```bash
git add src/routes/blog/
git commit -m "feat: add blog routes — listing and individual post pages with compiled MDX"
```

---

## Phase 3 — Features

### Task 9: Projects Page

**Files:**
- Create: `src/features/projects/types.ts`
- Create: `src/features/projects/data/fallback.ts`
- Create: `src/features/projects/lib/github.ts`
- Create: `src/features/projects/lib/service.ts`
- Create: `src/features/projects/components/ProjectCard.tsx`
- Create: `src/features/projects/components/ProjectList.tsx`
- Create: `src/routes/projects.tsx`

- [ ] **Step 1: Create `src/features/projects/types.ts`**

```ts
// src/features/projects/types.ts
export interface Project {
  id: string
  title: string
  description: string
  url: string
  github?: string
  tags: string[]
  logo: string
  color: string
}
```

- [ ] **Step 2: Create `src/features/projects/lib/github.ts`**

Copy `src/utils/github.ts` but fix the `import.meta.env.GITHUB_TOKEN` fallback — remove it entirely. The token is always injected from the Cloudflare env via the service layer. The function signature stays the same (`token?: string`).

```ts
// src/features/projects/lib/github.ts
// NOTE: import.meta.env.GITHUB_TOKEN removed — Cloudflare Workers do not expose
// env vars via import.meta.env. Token is always passed as a parameter from the loader.

export interface FormattedRepo {
  id: string
  title: string
  description: string
  githubUrl: string
  liveUrl?: string
  technologies: string[]
}

export async function fetchGitHubRepos(
  username: string,
  token: string
): Promise<FormattedRepo[]> {
  const headers = new Headers()
  headers.append('Accept', 'application/vnd.github.v3+json')
  if (token) headers.append('Authorization', `token ${token}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers, signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)

    const repos = await response.json() as Array<{
      id: number; name: string; description: string; html_url: string;
      homepage: string; fork: boolean; topics: string[]; language: string
    }>

    return repos
      .filter((r) => !r.fork)
      .map((r) => ({
        id: String(r.id),
        title: r.name,
        description: r.description ?? '',
        githubUrl: r.html_url,
        liveUrl: r.homepage || undefined,
        technologies: r.topics ?? [],
      }))
  } finally {
    clearTimeout(timeoutId)
  }
}
```

- [ ] **Step 3: Create `src/features/projects/data/fallback.ts`**

Copy the hardcoded project list from `src/pages/projects.astro` (the `manualProjects` array or equivalent). These use the `Project` interface shape with `id`, `title`, `description`, `url`, `github`, `tags`, `logo`, `color`.

```ts
// src/features/projects/data/fallback.ts
import type { Project } from '../types'

export const fallbackProjects: Project[] = [
  // paste all hardcoded project objects from src/pages/projects.astro
]
```

- [ ] **Step 4: Create `src/features/projects/lib/service.ts`**

```ts
// src/features/projects/lib/service.ts
import { fetchGitHubRepos, type FormattedRepo } from './github'
import { fallbackProjects } from '../data/fallback'
import { ok } from '../../../lib/result'
import type { Result } from '../../../lib/result'
import type { Project } from '../types'

// Merges live GitHub data with the fallback list.
// Fallback provides logo/color/tags not available from GitHub API.
// Live data provides updated liveUrl if set on the repo homepage.
function mergeWithFallback(liveRepos: FormattedRepo[], fallback: Project[]): Project[] {
  const liveByName = new Map<string, FormattedRepo>()
  for (const repo of liveRepos) {
    const name = repo.githubUrl.split('/').pop()
    if (name) liveByName.set(name, repo)
  }

  return fallback.map((project) => {
    const repoName = project.github?.split('/').pop()
    const live = repoName ? liveByName.get(repoName) : undefined
    if (!live) return project
    return { ...project, url: live.liveUrl ?? project.url }
  })
}

export async function getProjects(githubToken: string): Promise<Result<Project[]>> {
  try {
    const liveRepos = await fetchGitHubRepos('piyush97', githubToken)
    return ok(mergeWithFallback(liveRepos, fallbackProjects))
  } catch {
    // GitHub API failure is not fatal — serve fallback list silently
    return ok(fallbackProjects)
  }
}
```

- [ ] **Step 5: Create `src/features/projects/components/ProjectCard.tsx`**

Carry over from `src/components/ProjectCard.astro`. Convert `class=` → `className=`. All CSS class names are identical. Use the `Project` interface for props.

- [ ] **Step 6: Create `src/features/projects/components/ProjectList.tsx`**

```tsx
// src/features/projects/components/ProjectList.tsx
import type { Project } from '../types'
import { ProjectCard } from './ProjectCard'

interface Props { projects: Project[] }
export function ProjectList({ projects }: Props) {
  return (
    <div className="projects-grid">
      {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
    </div>
  )
}
```

- [ ] **Step 7: Create `src/routes/projects.tsx`**

```tsx
// src/routes/projects.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getProjects } from '../features/projects/lib/service'
import { ProjectList } from '../features/projects/components/ProjectList'
import { fallbackProjects } from '../features/projects/data/fallback'

export const Route = createFileRoute('/projects')({
  loader: async ({ context }) => {
    // Cloudflare Workers env is injected by the adapter into context
    const cfEnv = (context as { cloudflare?: { env?: Record<string, string> } })?.cloudflare?.env ?? {}
    const githubToken = cfEnv.GITHUB_TOKEN ?? ''
    if (!githubToken) return fallbackProjects
    const result = await getProjects(githubToken)
    return result.ok ? result.data : fallbackProjects
  },
  head: () => ({ meta: [{ title: 'Projects — Piyush Mehta' }] }),
  component: ProjectsPage,
})

function ProjectsPage() {
  const projects = Route.useLoaderData()
  return (
    <div className="container-base">
      <h1>Projects</h1>
      <ProjectList projects={projects} />
    </div>
  )
}
```

- [ ] **Step 8: Build verify**

```bash
pnpm build
```
Expected: Clean build, no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/features/projects/ src/routes/projects.tsx
git commit -m "feat: add projects page — GitHub API with static fallback, fixed env access"
```

---

### Task 10: Contact Form

**Files:**
- Create: `src/features/contact/lib/schemas.ts`
- Create: `src/features/contact/lib/repository.ts`
- Create: `src/features/contact/lib/service.ts`
- Create: `src/features/contact/components/ContactForm.tsx`
- Create: `src/routes/contact-me.tsx`
- Create: `src/routes/api/contact.ts`

- [ ] **Step 1: Create `src/features/contact/lib/schemas.ts`**

```ts
// src/features/contact/lib/schemas.ts
import { z } from 'zod'

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  _hp: z.string().max(0, 'Bot detected'),
})

export type ContactInput = z.infer<typeof ContactSchema>

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.errors.map((e) => [e.path.join('.') || 'form', e.message])
  )
}
```

- [ ] **Step 2: Create `src/features/contact/lib/repository.ts`**

```ts
// src/features/contact/lib/repository.ts
import { Resend } from 'resend'
import type { ContactInput } from './schemas'
import type { Env } from '../../../lib/env'

export async function sendContactEmail(input: ContactInput, env: Env): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY)
  await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    subject: `Contact from ${input.name}`,
    text: `Name: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
    replyTo: input.email,
  })
}
```

- [ ] **Step 3: Create `src/features/contact/lib/service.ts`**

```ts
// src/features/contact/lib/service.ts
import { ContactSchema, flattenZodErrors } from './schemas'
import { sendContactEmail } from './repository'
import { ok, err } from '../../../lib/result'
import { validationError, rateLimitedError, internalError } from '../../../lib/errors'
import type { Result } from '../../../lib/result'
import type { Env } from '../../../lib/env'

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export async function submitContact(
  input: unknown,
  env: Env,
  rateLimiter: RateLimiter | undefined,
  clientIp: string
): Promise<Result<void>> {
  // 1. Rate limit (skip if binding not available, e.g. local dev)
  if (rateLimiter) {
    const limit = await rateLimiter.limit({ key: clientIp })
    if (!limit.success) return err(rateLimitedError(60))
  }

  // 2. Validate
  const parsed = ContactSchema.safeParse(input)
  if (!parsed.success) return err(validationError(flattenZodErrors(parsed.error)))

  // 3. Honeypot — silently succeed
  if (parsed.data._hp) return ok(undefined)

  // 4. Send
  try {
    await sendContactEmail(parsed.data, env)
    return ok(undefined)
  } catch {
    return err(internalError())
  }
}
```

- [ ] **Step 4: Create `src/routes/api/contact.ts`**

```ts
// src/routes/api/contact.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { submitContact } from '../../features/contact/lib/service'
import { validateEnv } from '../../lib/env'

export const APIRoute = createAPIFileRoute('/api/contact')({
  POST: async ({ request, context }) => {
    const cfEnv = (context as { cloudflare?: { env?: Record<string, unknown> } })?.cloudflare?.env ?? {}
    const env = validateEnv(cfEnv)
    const rateLimiter = (cfEnv as { RATE_LIMITER?: { limit: (o: { key: string }) => Promise<{ success: boolean }> } }).RATE_LIMITER

    const body = await request.json().catch(() => null)
    if (!body) {
      return Response.json({ ok: false, error: { type: 'validation', fields: { form: 'Invalid request body' } } }, { status: 400 })
    }

    const ip = request.headers.get('cf-connecting-ip') ?? '127.0.0.1'
    const result = await submitContact(body, env, rateLimiter, ip)

    if (!result.ok) {
      const status = result.error.type === 'rate_limited' ? 429
        : result.error.type === 'validation' ? 400 : 500
      return Response.json({ ok: false, error: result.error }, { status })
    }

    return Response.json({ ok: true })
  },
})
```

- [ ] **Step 5: Create `src/features/contact/components/ContactForm.tsx`**

```tsx
// src/features/contact/components/ContactForm.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrors({})
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json() as { ok: boolean; error?: { type: string; fields?: Record<string, string> } }
    if (json.ok) {
      setStatus('success');
      (e.target as HTMLFormElement).reset()
    } else if (json.error?.type === 'validation') {
      setErrors(json.error.fields ?? {})
      setStatus('idle')
    } else {
      setStatus('error')
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <input type="text" name="_hp" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-field">
        <label htmlFor="name" className="form-label">Name</label>
        <input id="name" name="name" type="text" required className="form-input" />
        {errors.name && <p className="form-error" role="alert">{errors.name}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="email" className="form-label">Email</label>
        <input id="email" name="email" type="email" required className="form-input" />
        {errors.email && <p className="form-error" role="alert">{errors.email}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="message" className="form-label">Message</label>
        <textarea id="message" name="message" required rows={6} className="form-input form-textarea" />
        {errors.message && <p className="form-error" role="alert">{errors.message}</p>}
      </div>
      <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
      {status === 'success' && <p className="form-success" role="status">Message sent! I'll get back to you soon.</p>}
      {status === 'error' && <p className="form-error" role="alert">Something went wrong. Please try again.</p>}
    </form>
  )
}
```

- [ ] **Step 6: Create `src/routes/contact-me.tsx`**

```tsx
// src/routes/contact-me.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ContactForm } from '../features/contact/components/ContactForm'

export const Route = createFileRoute('/contact-me')({
  head: () => ({ meta: [{ title: 'Contact — Piyush Mehta' }] }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <div className="container-base">
      <h1>Get in touch</h1>
      <ContactForm />
    </div>
  )
}
```

- [ ] **Step 7: Build verify**

```bash
pnpm build
```
Expected: Clean build, no TypeScript errors in contact layer.

- [ ] **Step 8: Commit**

```bash
git add src/features/contact/ src/routes/contact-me.tsx src/routes/api/contact.ts
git commit -m "feat: add contact form — Zod validation, rate limiting, honeypot, Resend"
```

---

### Task 11: Feed Routes (RSS, Sitemap, Robots)

**Files:**
- Create: `src/features/feeds/lib/rss.ts`
- Create: `src/features/feeds/lib/sitemap.ts`
- Create: `src/routes/api/rss[.]xml.ts`
- Create: `src/routes/api/sitemap[.]xml.ts`
- Create: `src/routes/api/robots[.]txt.ts`

**Important note on routing:** Feed files live in `src/routes/api/` for organization, but `createAPIFileRoute('/rss.xml')` specifies the URL path as `/rss.xml` (not `/api/rss.xml`). The first argument to `createAPIFileRoute` is the canonical URL path — the file location is irrelevant. RSS subscribers who bookmarked `/rss.xml` will not be broken.

- [ ] **Step 1: Create `src/features/feeds/lib/rss.ts`**

```ts
// src/features/feeds/lib/rss.ts
import type { Post } from '../../blog/types'

const SITE_URL = 'https://piyushmehta.com'

export function generateRss(posts: Post[]): string {
  const items = posts.slice(0, 20).map((post) => `
    <item>
      <title><![CDATA[${post.frontmatter.title}]]></title>
      <description><![CDATA[${post.frontmatter.description}]]></description>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${post.frontmatter.date.toUTCString()}</pubDate>
    </item>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Piyush Mehta</title>
    <description>Technical writing on software engineering, distributed systems, and web development.</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-US</language>
    ${items}
  </channel>
</rss>`
}
```

- [ ] **Step 2: Create `src/features/feeds/lib/sitemap.ts`**

```ts
// src/features/feeds/lib/sitemap.ts
import type { Post } from '../../blog/types'

const SITE_URL = 'https://piyushmehta.com'
const STATIC_ROUTES = ['/', '/about', '/blog', '/projects', '/uses', '/videos', '/contact-me']

export function generateSitemap(posts: Post[]): string {
  const staticUrls = STATIC_ROUTES.map((route) => `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>monthly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('')

  const postUrls = posts.map((post) => `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.frontmatter.date.toISOString().split('T')[0]}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${postUrls}
</urlset>`
}
```

- [ ] **Step 3: Create `src/routes/api/rss[.]xml.ts`**

```ts
// src/routes/api/rss[.]xml.ts — served at /rss.xml (path set in createAPIFileRoute)
import { createAPIFileRoute } from '@tanstack/start/api'
import { listPosts } from '../../features/blog/lib'
import { generateRss } from '../../features/feeds/lib/rss'

export const APIRoute = createAPIFileRoute('/rss.xml')({
  GET: () => {
    const result = listPosts()
    const posts = result.ok ? result.data : []
    return new Response(generateRss(posts), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  },
})
```

- [ ] **Step 4: Create `src/routes/api/sitemap[.]xml.ts`**

```ts
// src/routes/api/sitemap[.]xml.ts — served at /sitemap.xml
import { createAPIFileRoute } from '@tanstack/start/api'
import { listPosts } from '../../features/blog/lib'
import { generateSitemap } from '../../features/feeds/lib/sitemap'

export const APIRoute = createAPIFileRoute('/sitemap.xml')({
  GET: () => {
    const result = listPosts()
    const posts = result.ok ? result.data : []
    return new Response(generateSitemap(posts), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  },
})
```

- [ ] **Step 5: Create `src/routes/api/robots[.]txt.ts`**

```ts
// src/routes/api/robots[.]txt.ts — served at /robots.txt
import { createAPIFileRoute } from '@tanstack/start/api'

export const APIRoute = createAPIFileRoute('/robots.txt')({
  GET: () =>
    new Response(
      `User-agent: *\nAllow: /\nSitemap: https://piyushmehta.com/sitemap.xml`,
      { headers: { 'Content-Type': 'text/plain' } }
    ),
})
```

- [ ] **Step 6: Start dev server and verify all three feeds**

```bash
pnpm dev &
sleep 5
curl -s http://localhost:3000/rss.xml | head -5
curl -s http://localhost:3000/sitemap.xml | head -5
curl -s http://localhost:3000/robots.txt
```

Expected:
- `/rss.xml` → `<?xml version="1.0" ...` with `<rss` tag
- `/sitemap.xml` → `<?xml version="1.0" ...` with `<urlset` tag
- `/robots.txt` → `User-agent: *`

- [ ] **Step 7: Commit**

```bash
git add src/features/feeds/ src/routes/api/rss* src/routes/api/sitemap* src/routes/api/robots*
git commit -m "feat: add RSS, sitemap, and robots.txt feed routes at correct URL paths"
```

---

## Phase 4 — Production Hardening

### Task 12: Sentry + E2E Tests + Deployment

- [ ] **Step 1: Update `playwright.config.ts` for Vinxi dev server**

```ts
// playwright.config.ts — update these two values
webServer: {
  command: 'pnpm dev',
  url: 'http://localhost:3000',    // Vinxi default (was 4321)
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
},
use: {
  baseURL: 'http://localhost:3000', // was 4322
},
```

- [ ] **Step 2: Delete OG-image spec files (testing dropped features)**

```bash
rm tests/og-image.spec.ts
rm tests/og-image-api.spec.ts
rm tests/og-image-performance.spec.ts
rm tests/og-image-visual.spec.ts
rm tests/og-image-unit.spec.ts
rm tests/command-palette.spec.ts   # if it references dropped components
```

Verify what remains:
```bash
ls tests/
```
Expected remaining: `code-blocks.spec.ts`, `integration.spec.ts`, `reading-progress.spec.ts`, `related-posts.spec.ts`, `simple.spec.ts`

- [ ] **Step 3: Update remaining test files for React structure**

Read each remaining test file and remove or update:
- Any selector targeting `/api/og/` or `/api/newsletter` — these routes no longer exist
- Any selector using Astro-specific attributes (none expected, but verify)
- Any test importing or navigating to dropped pages (`/og-showcase`, `/offline`)

```bash
grep -rn "og-showcase\|/offline\|/api/og\|api/newsletter" tests/
```
Expected: No matches. If any found, delete those test cases.

- [ ] **Step 4: Configure Sentry for Cloudflare Workers**

`@sentry/cloudflare` wraps the Worker fetch handler at the entry point — NOT via `Sentry.init()` in a loader. Locate the Vinxi Cloudflare adapter's generated entry file path after build, then add Sentry wrapping.

In `app.config.ts`, add Sentry config for the server:
```ts
// In app.config.ts — add to defineConfig
server: {
  preset: 'cloudflare-workers',
},
```

Then create a custom entry wrapper at `src/entry.server.ts` if supported by the Vinxi Cloudflare preset:
```ts
// src/entry.server.ts (check if Vinxi Cloudflare preset supports a custom entry)
import * as Sentry from '@sentry/cloudflare'
import { createRequestHandler } from '@tanstack/start/server'

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext) {
    return Sentry.withSentry(
      () => ({
        dsn: (env.SENTRY_DSN as string) ?? '',
        tracesSampleRate: 0.1,
      }),
      async () => {
        const handler = createRequestHandler({ /* TanStack Start handler */ })
        return handler(request, env, ctx)
      }
    )(request, env, ctx)
  },
}
```

**Note:** The exact Vinxi Cloudflare entry wrapping API may differ — check `@sentry/cloudflare` docs for the current Cloudflare Workers integration pattern before implementing. If a custom entry is not supported, instrument Sentry in the route loader context as a fallback (with the caveat that init is per-request).

- [ ] **Step 5: Run E2E tests**

```bash
pnpm dev &
sleep 8
pnpm test
```
Expected: All remaining tests pass. Fix any failing tests before proceeding.

- [ ] **Step 6: Full production build**

```bash
pnpm build
```
Expected: Clean build, `.output/` contains `server/index.mjs` and `public/`.

- [ ] **Step 7: Preview with Wrangler (local Cloudflare simulation)**

```bash
pnpm preview
```
Visit `http://localhost:8787` and verify:
- [ ] Homepage renders with correct dark theme
- [ ] Theme toggle switches between dark → light → high-contrast
- [ ] Blog listing shows published posts
- [ ] Blog post (`/blog/bloom-filters`) renders with interactive components
- [ ] `/rss.xml` returns valid XML
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/robots.txt` returns text
- [ ] Contact form is visible at `/contact-me`

- [ ] **Step 8: Set Cloudflare secrets and deploy**

```bash
wrangler login
wrangler secret put RESEND_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put SENTRY_DSN
pnpm deploy
```
Expected: Deployment URL printed.

- [ ] **Step 9: Verify security headers on live site**

```bash
curl -sI https://piyushmehta.com | grep -iE "x-frame|content-security|strict-transport"
```
Expected: `X-Frame-Options: DENY`, `Content-Security-Policy: ...`, `Strict-Transport-Security: ...` all present.

- [ ] **Step 10: Final commit and PR**

```bash
git add playwright.config.ts tests/
git commit -m "feat: production hardening — delete OG test files, update E2E for Vinxi, Sentry setup"

git push origin tanstack-migration
gh pr create --title "feat: migrate from Astro 5 to TanStack Start + Cloudflare Workers" \
  --body "Full rewrite per docs/superpowers/specs/2026-03-19-tanstack-start-migration-design.md. Core pages preserved, CSS/theme system unchanged, MDX compiled at build time."
```

---

## Final Verification Checklist

- [ ] `pnpm build` succeeds cleanly (no TypeScript errors)
- [ ] `pnpm test` — all E2E tests pass
- [ ] Homepage renders with correct dark theme by default
- [ ] Theme switching: dark → light → high-contrast → back works
- [ ] Blog listing shows all published posts (20+)
- [ ] Blog post with MDX interactive components (`/blog/bloom-filters`) renders — components visible, no console errors
- [ ] Projects page loads with project cards
- [ ] Contact form visible at `/contact-me`
- [ ] `/rss.xml` — valid RSS XML with post entries
- [ ] `/sitemap.xml` — valid sitemap XML with all routes
- [ ] `/robots.txt` — `User-agent: *` present
- [ ] Security headers present on deployed site: `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`
- [ ] No `process.env` references in any server-side code
- [ ] No `client:load` or `client:visible` attributes in MDX files
- [ ] No `import.meta.env` in `src/features/projects/lib/github.ts`
