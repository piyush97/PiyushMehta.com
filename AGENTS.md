# Repository Guidelines

## Project Overview

Personal website and blog for Piyush Mehta (`piyushmehta.com`) — a portfolio, technical blog, newsletter platform, and consulting landing page. Built with **Astro 7.x** (SSR, server output), **TypeScript 6.x**, **React 19** islands, **MDX** blog content, **Tailwind CSS v4**, deployed to **Vercel** with ISR (24h expiration).

Key capabilities:
- Blog with MDX content, syntax-highlighted code blocks, Giscus comments
- Social card / OG image generation pipeline (satori + resvg-js)
- Newsletter subscription (Resend + Upstash Redis + PostgreSQL)
- Contact form with CSRF protection and rate limiting
- Blog post reactions (Upstash Redis)
- Global search via Pagefind
- Accessibility-verified design
- Sentry error monitoring (client + server)
- Full RSS feed, sitemap, robots.txt

---

## Architecture & Data Flow

### Rendering Model

```
Browser ──► Astro SSR (Vercel) ──► React Islands (client:load/visible/idle)
                │
                ├── MDX Content Collections ──► src/content/blog/**/*.mdx
                ├── API Endpoints ──► src/pages/api/*.ts
                └── Middleware ──► Security headers, OG caching
```

- **Astro pages** render server-side, produce static HTML with optional hydration directives for React islands
- **React islands** (`*.tsx`) hydrate on the client via `client:load`, `client:visible`, or `client:idle` directives
- **API routes** (`src/pages/api/*.ts`) are serverless functions — all set `prerender = false`
- **Middleware** (`src/middleware/index.ts`) chains security headers and OG cache via `astro/middleware` `sequence`

### Data Dependencies

| Service | Usage | Library |
|---------|-------|---------|
| **Upstash Redis** | Rate limiting, reaction counters, newsletter rate limiting | `@upstash/redis`, `@upstash/ratelimit` |
| **ioredis** | Fallback Redis client (when Upstash unavailable) | `ioredis` |
| **PostgreSQL** | Newsletter subscriber persistence | `pg` |
| **Resend** | Transactional email (contact form, newsletter confirmation) | `resend` |
| **GitHub API** | Project repository data for showcase | `fetch` (native) |
| **Sentry** | Error monitoring (client + server) | `@sentry/astro` |
| **Vercel Speed Insights** | Performance analytics | `@vercel/speed-insights` |

### Build Pipeline

```
scripts/build.mjs orchestrates:
  1. bunx varlock typegen         — Generate env type definitions
  2. migrate-images-to-public     — Copy blog images → public/
  3. astro build                  — Main Astro SSR build
  4. run-pagefind                 — Search index over dist/client/
  5. generate-enhanced-sitemap    — Post-build sitemap.xml
  6. generate-static-rss          — Post-build rss.xml
  7. generate-resume-pdf          — Resume PDF via Playwright
```

---

## Key Directories

| Path | Purpose | Contents |
|------|---------|---------|
| `src/components/` | UI components | 28 Astro (`.astro`) + 14 React (`.tsx`) islands |
| `src/pages/` | File-based routes + API | 19 pages + 10 API endpoints + 6 special routes (RSS, sitemap, OG) |
| `src/pages/api/` | Serverless functions | newsletter, contact, reactions, OG image, metrics |
| `src/layouts/` | Page shell | Single `Layout.astro` — props-driven SEO/meta, ClientRouter, theme |
| `src/utils/` | Shared logic | OG generation, SEO helpers, GitHub API, newsletter, Sentry, schema.org |
| `src/middleware/` | Request middleware | Security headers (`security.ts`), OG image caching (`og-cache.ts`) |
| `src/styles/` | Styling | `global.css` (2381 lines, Tailwind v4 + 7 themes), critical/ CSS split by route |
| `src/content/` | Blog content | MDX frontmatter with schema-validated collections (`content.config.ts`) |
| `src/types/` | TypeScript definitions | Schema.org JSON-LD types (`schema.ts`) |
| `scripts/` | Build pipeline | 20+ scripts: build orchestration, RSS, sitemap, critical CSS, image migration |
| `tests/` | Playwright E2E | 17+ spec files covering all routes + OG + a11y + performance |
| `public/` | Static assets | Service worker, fonts, icons, generated RSS/sitemap/PDF |

---

## Development Commands

```bash
# Development
bun run dev              # Start dev server (port 4321)
bun run start            # Alias for dev

# Build
bun run build            # Full pipeline (typegen → images → astro → pagefind → sitemap → RSS)
bun run preview          # Preview production build

# Lint & Format (Vite+)
bun run lint             # Lint with Oxlint
bun run lint:fix         # Lint with auto-fix
bun run format           # Format with Oxfmt
bun run check            # Full Vite+ check (format + lint + type checks)
bun run check:write      # Check with auto-fix
bun run ci               # CI check (read-only)

# Testing (Playwright)
bun run test             # Run all Playwright tests
bun run test:smoke       # Smoke tests only
bun run test:headed      # Headed browser mode
bun run test:ui          # Playwright UI mode
bun run test:report      # Show HTML report
node run-og-tests.js     # OG-specific test suite

# Scripts
bun run enhance-sitemap  # Generate enhanced sitemap
bun run generate-rss     # Generate static RSS feed
bun run verify-rss       # Validate RSS output
bun run migrate:images   # Copy blog images to public/
bun run doctor           # Run react-doctor analysis
```

---

## Code Conventions & Common Patterns

### Formatting & Linting (Vite+)

Configured in `vite.config.ts`:
- **Indent**: 2 spaces, `lf` line endings
- **Semicolons**: always
- **Quotes**: single

Active lint rules:
- Oxlint's recommended correctness and TypeScript rules, with Vite+ import checks
- Type-aware linting and TypeScript diagnostics through `tsgolint`

### Naming

| Artifact | Convention | Examples |
|----------|-----------|---------|
| Components | PascalCase | `BlogCard.astro`, `ContactForm.tsx`, `GitHubProjectIsland.tsx` |
| Functions/variables | camelCase | `generateCacheKey`, `fetchGitHubRepos` |
| Types/interfaces | PascalCase | `OGImageOptions`, `SocialCardData`, `FormattedRepo` |
| Files | PascalCase for components, camelCase for utils | `BlogFilter.astro`, `og-generator.ts` |
| API routes | kebab-case | `og-enhanced.ts`, `newsletter-metrics.ts` |

### Path Aliases

All defined in `tsconfig.json` — use `@/*` rather than relative imports:
```typescript
import { Layout } from '@/layouts/Layout.astro'
import { OGImageOptions } from '@/utils/og-generator'
import type { Schema } from '@/types/schema'
```

### Component Patterns

**Astro components** (`.astro`):
- Server-rendered by default
- Export a `Props` interface for type-checked component props
- Use scoped `<style>` or Tailwind utility classes
- Inline `<script>` tags for client interactivity when no React is needed

```astro
---
export interface Props {
  title: string
  description?: string
}
const { title, description } = Astro.props
---
<div class="card">
  <h2>{title}</h2>
  {description && <p>{description}</p>}
</div>
```

**React islands** (`.tsx`):
- Must be interactive — use `export default` for the component
- Hydration via `client:load`, `client:visible`, or `client:idle` in parent Astro file
- No global state — props-driven, self-contained
- Blog domain-specific islands live in `src/components/blog/`

```astro
<ContactForm client:load />
<GitHubProjectIsland client:visible />
```

### API Route Pattern

All API routes export `const METHOD: APIRoute`, set `prerender = false`, and return `new Response(JSON.stringify(...))`:

```typescript
import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  // Validation, business logic
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
```

### Error Handling

- Try/catch with structured error responses (status codes, JSON body)
- Sentry capture for server errors via `@sentry/astro`
- Client-side errors captured through `sentry-client.ts`
- Fallback-first architecture: Upstash → ioredis → in-memory → DB → manual logging

### Environment Variable Pattern

Declared in `.env.schema` with `@varlock/astro-integration` — generates TypeScript definitions to `src/varlock.env.d.ts`:
- `@optional` / `@required` for presence
- `@sensitive` for secrets (excluded from client bundles)
- `@type=url|number|boolean|email` for type coercion
- Public-facing vars prefixed `PUBLIC_`

```bash
PUBLIC_SENTRY_DSN=           # Exposed to browser
SENTRY_AUTH_TOKEN=           # Build-time only, sensitive
```

### Utility Pattern

Pure functions, no classes. Testability via injected dependencies:
```typescript
export async function addToResendAudience(
  email: string,
  apiKey: string,
  segmentId?: string,
  _fetch: typeof fetch = fetch  // injectable for tests
): Promise<Response>
```

### Caching Strategy

- **OG images**: In-memory Map with 1-year TTL, SHA-256 cache keys from sorted params, SWR 1-day, ETag via SHA-256 truncated, multi-layer `Cache-Control` (CDN-Cache-Control, Vercel-CDN-Cache-Control)
- **Static assets**: 1-year immutable (images, JS, CSS via vercel.json headers)
- **API responses**: Route-specific (OG: 1h, RSS: 1h, sitemap: 1h)
- **ISR**: 24h expiration via Vercel adapter

---

## Important Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro configuration (integrations, Vercel adapter, prefetch, manual chunks) |
| `src/content.config.ts` | Content collection schema (blog MDX validation) |
| `src/layouts/Layout.astro` | Single site layout — SEO, theme, scroll animations |
| `src/middleware/index.ts` | Middleware entry — chains security headers |
| `src/middleware/security.ts` | CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| `src/middleware/og-cache.ts` | OG image caching (in-memory, TTL, SWR, ETag) |
| `src/utils/og-generator.ts` | OG image generation — 5 templates, 3 themes |
| `src/utils/social-card.ts` | Social card types / data / pure utilities |
| `src/utils/social-card-renderer.ts` | SVG→PNG rendering pipeline (satori + resvg-js) |
| `src/utils/schema-generator.mjs` | 7 schema.org JSON-LD generators (Person, Website, Blog, FAQ, etc.) |
| `src/utils/newsletter.ts` | Resend API integration (audience + confirmation email) |
| `src/utils/github.ts` | GitHub repo fetch + formatting |
| `src/utils/seo-redirects.js` | Trailing slash, www removal, path map redirects |
| `vercel.json` | Clean URLs, redirects, security headers, CSP, cache policies |
| `vite.config.ts` | Vite+, Oxfmt, and Oxlint configuration |
| `.env.schema` | All environment variables documented with types |
| `scripts/build.mjs` | Build pipeline orchestrator |
| `lefthook.yml` | Pre-commit hooks (Vite+ check, varlock scan, react-doctor) |

---

## Runtime/Tooling Preferences

| Tool | Requirement |
|------|-------------|
| **Runtime** | **Bun** (package manager + runtime). `packageManager: "bun@1.3.13"` in package.json |
| **Node.js** | 22.x (engines field, CI pinning) |
| **Package manager** | **Bun exclusively** — `bun install --frozen-lockfile` in CI. `bun.lock` is lockfile |
| **Linter/Formatter** | **Vite+** (Oxfmt + Oxlint) — no ESLint, Prettier, or Biome |
| **TypeScript** | Strict mode via `astro/tsconfigs/strict`. TypeScript 6.x |
| **Testing** | **Playwright** only — no Jest, no Vitest |
| **CSS** | Tailwind CSS v4 + custom CSS variables |
| **Pre-commit hooks** | Lefthook — runs Vite+ check + varlock scan + react-doctor on staged files |
| **Env validation** | `@varlock/astro-integration` — type generation + schema validation |
| **Package builds** | Controlled via `pnpm-workspace.yaml` — only specific packages allowed to build native deps |

---

## Testing & QA

### Framework

**Playwright** exclusively — all tests in `tests/` directory. No `__tests__` folders.

### Test Categories

| Category | Files | Description |
|----------|-------|-------------|
| **Smoke** | `portfolio-smoke.spec.ts`, `migration-smoke.spec.ts` | Core routes 200, content visibility, console error monitoring |
| **OG Images** | `og-image.spec.ts`, `og-image-api.spec.ts`, `og-image-unit.spec.ts`, `og-image-performance.spec.ts`, `og-image-visual.spec.ts` | Functional, API, unit, performance, visual regression |
| **Blog features** | `reading-progress.spec.ts`, `related-posts.spec.ts`, `post-reactions.spec.ts`, `code-blocks.spec.ts` | Per-component E2E |
| **Interactive** | `command-palette.spec.ts`, `social-card.spec.ts` | Search, keyboard nav, OG metadata |
| **Integration** | `integration.spec.ts` | Cross-feature interaction |
| **Newsletter** | `newsletter.test.ts` | Node.js `node:test` (not Playwright) — unit tests with mock fetch |
| **Accessibility** | `accessibility.spec.ts` | Axe-core WCAG scans on 6 routes |

### Running Tests

```bash
bun run test                     # Full Playwright suite (3 browsers + 2 mobile)
bun run test:smoke               # Smoke tests only
bun run test -- --project=chromium  # Single browser
node tests/newsletter.test.ts    # Newsletter unit tests (Node built-in test runner)
```

### CI Pipeline

3 workflows in `.github/workflows/`:
1. **ci-cd.yml** — Code Quality (Vite+ check) → Build Verification → Security Configuration Check (E2E tests commented out)
2. **codeql-analysis.yml** — CodeQL security scan + dependency review on push/PR and weekly
3. **dependency-updates.yml** — Weekly `bun update` → verify → auto PR

Key CI details:
- step-security/harden-runner on all CI steps
- Bun `--frozen-lockfile` for deterministic installs
- Vite+ `check` command (read-only)
- Build output verified via `dist/` directory existence

### Test Patterns

- **Page Object**: Not used — tests directly interact via Playwright selectors
- **Mocks**: Newsletter unit test injects `_fetch` mock; OG tests use `page.route()` interception for analytics
- **Assertions**: Playwright `expect` (auto-retrying), `@axe-core/playwright` `AxeBuilder` for a11y
- **Visual regression**: OG visual tests use Playwright screenshot comparison with 0.1 threshold

### Coverage Expectations

- No formal coverage thresholds configured
- All core routes smoke tested (10 pages in portfolio smoke)
- All OG templates rendered + validated in multiple test suites
- Accessibility checked on 5 core routes + 1 blog post
- Cross-browser: Chromium, Firefox, WebKit, Pixel 5, iPhone 13

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp run test` to validate static checks and Playwright tests.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
