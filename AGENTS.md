# Repository Guidelines

## Project Overview

`piyushmehta.com` is Piyush Mehta's personal site: portfolio, technical blog, newsletter, contact/consulting pages, resume, and generated social cards. It uses Astro server output on Cloudflare Workers, strict TypeScript, React islands, MDX content, and Tailwind CSS v4.

Core integrations:

- Resend for contact and newsletter delivery
- Upstash Redis for newsletter limits and post reactions
- Satori + Resvg for social-card PNG rendering
- Sentry for conditional client/server monitoring
- Pagefind for the post-build search index

Treat source and configuration as authoritative. Several setup documents describe removed integrations or commands.

## Architecture & Data Flow

```text
Browser -> Astro routes -> Layout.astro -> server-rendered HTML
                    |              -> optional React/DOM interactivity
                    |-> blog collection (MDX)
                    |-> static portfolio data
                    |-> runtime API/social-image routes -> external services
                    `-> security middleware
```

- `src/layouts/Layout.astro` is the shared shell: global CSS, navigation, SEO, footer, theme initialization, `ClientRouter`, and motion setup.
- Most page routes are prerendered. Runtime work lives in `src/pages/api/`, `src/pages/opengraph-image.ts`, `src/pages/twitter-image.ts`, and `src/pages/og/[...params].png.ts`.
- `src/content.config.ts` defines the `blog` collection. Posts normally live at `src/content/blog/<slug>/index.mdx`.
- `src/pages/blog.astro` reads, filters, and sorts posts. `src/pages/blog/[slug].astro` creates post routes and renders MDX. `src/components/BlogFilter.astro` performs filtering with a DOM script rather than React.
- Portfolio pages read typed constants from `src/data/portfolio.ts`; the GitHub utility is not part of the active projects flow.
- Active middleware is `src/middleware/security.ts`, composed by `src/middleware/index.ts`. `src/middleware/og-cache.ts` is currently dormant.
- There is no global state store or dependency-injection container. State stays in component hooks, DOM/data attributes, `localStorage`, or server module singletons.
- `scripts/build.mjs` runs Varlock code generation, image migration, Astro build, then optional Pagefind and resume-PDF steps. The build can rewrite MDX image paths and copy images into `public/blog/`; inspect source changes after image-related builds.

Important content caveat: `draft: true` hides posts from listings, tags, RSS, and sitemap, but does not currently prevent direct post generation or related-post exposure.

## Key Directories

| Path | Purpose |
| --- | --- |
| `src/pages/` | Astro routes, dynamic blog routes, feeds, and runtime endpoints |
| `src/components/` | Astro UI and interactive React islands |
| `src/layouts/` | Shared page shell |
| `src/content/blog/` | MDX posts and post-local images |
| `src/data/` | Typed static portfolio/project content |
| `src/utils/` | Newsletter, SEO/schema, and social-card logic |
| `src/middleware/` | Request security middleware |
| `src/scripts/` | Browser-side behavior such as site motion |
| `src/styles/` | Tailwind v4 entry point, themes, tokens, and shared CSS |
| `scripts/` | Build, image migration, PDF, and operational scripts |
| `tests/` | Playwright E2E plus the newsletter unit test |
| `public/` | Static assets and maintained blog-image mirrors |

Do not edit generated or ignored output under `dist/`, `.wrangler/`, `.astro/`, Playwright report/result directories, or `public/resume.pdf`.

## Development Commands

Use `bun run <script>` for package scripts. `bun build` and `bun test` invoke Bun built-ins, not the repository's build and Playwright scripts.

```bash
bun install --frozen-lockfile
bun run dev                   # Astro dev server on port 4321
bun run check                 # astro sync + Varlock codegen + Vite+ checks
bun run check:write           # Apply supported check fixes
bun run lint                  # Vite+/Oxlint
bun run lint:fix
bun run format                # Oxfmt write mode
bun run build                 # Full scripts/build.mjs pipeline
bun run preview

bun run test                  # All Playwright projects
bun run test:smoke            # portfolio-smoke.spec.ts only
bun run test:headed
bun run test:ui
bun run test:report
```

Focused validation:

```bash
bunx playwright test tests/<name>.spec.ts --project=chromium
bunx playwright test tests/<name>.spec.ts --project=chromium -g '<case>'
bun test tests/newsletter.test.ts
```

Install browser binaries when needed with `bunx playwright install --with-deps`.

## Code Conventions & Common Patterns

### Formatting and types

- Vite+ configuration is in `vite.config.ts`: 2-space indentation, semicolons, single quotes, and type-aware linting.
- `tsconfig.json` extends Astro strict mode. Keep types local to their domain and use `import type` for type-only imports.
- Tests are excluded from the repository formatter/linter; preserve the surrounding Playwright style manually.
- Aliases such as `@/components`, `@/utils`, and `@/scripts/*` exist in `tsconfig.json` and `astro.config.mjs`. Match neighboring imports rather than introducing a second convention.

### Naming and components

- Components: PascalCase (`ContactForm.tsx`, `BlogFilter.astro`).
- Functions and variables: camelCase. Types and interfaces: PascalCase.
- Utility files and static route files: lowercase or kebab-case. Dynamic routes use Astro brackets.
- Astro components normally declare a local `Props` interface and destructure `Astro.props`.
- Use Astro for server-rendered/static UI. Add a React island only for interaction that benefits from React state; choose the least eager appropriate hydration directive.
- For small enhancements, prefer semantic HTML plus scoped scripts and `data-*` selectors. Because `ClientRouter` performs transitions, initialize page behavior on `astro:page-load`, not only initial document load.
- Reuse tokens and patterns from `src/styles/global.css`. Follow the nearest component's scoped-CSS, utility, or BEM-like convention instead of adding another styling system.

### APIs, async work, and errors

- API files export `prerender = false` where required and method-named `APIRoute` handlers such as `GET` or `POST`.
- Validate early and return explicit `Response` objects with meaningful HTTP status codes and JSON bodies.
- Preserve route-specific failure behavior: contact/newsletter report server failures, reactions degrade GET reads but reject unavailable writes, and social-card rendering returns its fallback PNG.
- Keep external work asynchronous and handle non-OK responses before consuming success data.
- Prefer narrow dependency injection for testability, following `_fetch: typeof fetch = fetch` in `src/utils/newsletter.ts`; do not add a container or global abstraction.
- React forms use controlled local state with `idle | sending | success | error` transitions. Reactions use optimistic updates, pending guards, and abort controllers. Preserve these state invariants.

### Content and environment

- Blog frontmatter requires `title` and `date`; defaults/optional fields are defined only in `src/content.config.ts`.
- Valid OG templates are `default`, `minimal`, `tech`, `blog`, `modern`, and `professional`; themes are `dark`, `light`, and `retro`.
- Publish local post images as `/blog/<slug>/images/...`; `public/blog/**` mirrors post-local source images and is not an independent source.
- `.env.schema` plus runtime callsites are authoritative. Example env files include legacy variables.
- Never edit generated `src/varlock.env.d.ts`; regenerate through `bun run check` or `bunx varlock codegen`.

## Important Files

| File | Why it matters |
| --- | --- |
| `astro.config.mjs` | Cloudflare Workers server output, integrations, aliases, build-time images, and chunk settings |
| `vite.config.ts` | Vite+ formatting, linting, and type-check policy |
| `playwright.config.ts` | E2E projects, dev server, retries, artifacts, and timeouts |
| `.env.schema` | Operational environment contract |
| `scripts/build.mjs` | Actual build orchestration and required/optional steps |
| `src/layouts/Layout.astro` | Site shell and browser lifecycle |
| `src/content.config.ts` | Blog schema and accepted frontmatter |
| `src/pages/blog.astro` | Blog listing pipeline |
| `src/pages/blog/[slug].astro` | Post route generation and MDX rendering |
| `src/data/portfolio.ts` | Active portfolio/project data source |
| `src/pages/api/contact.ts` | Contact validation, rate limit, and Resend flow |
| `src/pages/api/newsletter.ts` | Newsletter rate limit and subscription flow |
| `src/pages/api/reactions.ts` | Redis-backed reaction API |
| `src/utils/social-card-renderer.ts` | Satori/Resvg rendering and fallback behavior |
| `src/middleware/security.ts` | Active response security headers |
| `src/styles/global.css` | Tailwind entry point, design tokens, themes, accessibility, motion |
| `src/scripts/site-motion.ts` | Transition-aware reveal/parallax behavior |

## Runtime/Tooling Preferences

- Runtime/package manager: Bun, pinned by `packageManager` to `bun@1.3.13`.
- Node compatibility: Node 22.x, pinned in `package.json`, `.node-version`, and `.nvmrc`.
- Modules: ESM.
- Package lock: `bun.lock`; do not introduce npm, pnpm, or Yarn lockfiles.
- Toolchain: Vite+ (`vp`) with Oxlint/Oxfmt. Do not add ESLint, Prettier, or Biome alongside it.
- Environment typing: Varlock. Run code generation before type-sensitive checks/builds.
- Deployment: Cloudflare Workers Static Assets on the Free plan through Workers Builds GitHub integration. Pages and social cards are prerendered; only API routes execute Worker code. GitHub Actions validates checks/builds but does not deploy.
- `scripts/send-newsletter.mjs` creates and sends a real Resend broadcast. Never run it as validation or without explicit authorization.

## Testing & QA

- Playwright is the E2E framework. Projects: Chromium, Firefox, WebKit, mobile Chrome, and mobile Safari. The configured web server is the Astro dev server at `http://localhost:4321`.
- `tests/newsletter.test.ts` is a separate `node:test`-style unit suite; run it with Bun as shown above.
- Start with the narrowest relevant spec on Chromium. Expand to all desktop/mobile projects only for compatibility-sensitive behavior, then run `bun run check`.
- Prefer role/label locators, web-first assertions, deterministic local routes, Playwright's `request` fixture for HTTP contracts, and injected `fetch` for utility tests.
- Do not copy fixed sleeps or `if (locator.count() > 0)` guards; both can hide failures.
- No coverage provider or threshold is configured. Accessibility tests assert zero critical Axe findings, not complete WCAG conformance.
- Do not assume the full suite is a green gate. Current legacy OG suites target removed API routes; command-palette and reading-progress specs target removed selectors; `simple.spec.ts` targets production; and the E2E CI job is commented out. Validate the changed behavior directly and report scoped results accurately.

## Agent skills

### Issue tracker

Issues live in GitHub Issues at github.com/piyush97/PiyushMehta.com. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
