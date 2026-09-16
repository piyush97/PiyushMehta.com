# piyushmehta.com

Personal portfolio and blog. Astro 7 on Cloudflare Workers — static pages at the edge, four Worker routes for the parts that need a server.

__omp_shell("[](.github/demo.gif)")

## How it works

Almost everything is prerendered at build time and served from Cloudflare's static asset store. Four routes execute Worker code:

```
                    ┌─ 18 page routes                    ─┐
                    │  39 blog posts (MDX)                │
Request ────────────│  /og/*.png social cards             │──> Cloudflare static assets
                    │  rss.xml, sitemap.xml, robots.txt   │
                    └─ Pagefind search index             ─┘

                    ┌─ /api/contact                      ─┐
                    │  /api/newsletter                    │
                    │  /api/reactions                     │──> Worker ──> Resend / Upstash Redis
                    └─ /api/newsletter-metrics (stub)    ─┘
```

That split is the main design constraint. Pages cost nothing to serve and cannot fail at runtime; anything dynamic has to justify a Worker invocation.

| Layer | Choice |
|---|---|
| Framework | [Astro 7](https://astro.build/) — `@astrojs/cloudflare` adapter, server output |
| UI | [React 19](https://react.dev/) islands — only where interaction needs state |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`, design tokens in `src/styles/global.css` |
| Language | TypeScript 7, Astro strict mode |
| Content | MDX with interactive components |
| Social cards | [Satori](https://github.com/vercel/satori) + [`@resvg/resvg-js`](https://github.com/thx/resvg-js) — rendered at build, not per request |
| Search | [Pagefind](https://pagefind.app/) — index built post-build over `data-pagefind-body` |
| Email | [Resend](https://resend.com/) — contact form and newsletter |
| Rate limiting | [Upstash Redis](https://upstash.com/) — `@upstash/ratelimit` on newsletter and reactions |
| Comments | [Giscus](https://giscus.app/) — GitHub Discussions |
| Monitoring | [Sentry](https://sentry.io/) — enabled only when a DSN is present |
| Env | [varlock](https://varlock.dev/) — schema validation, typed access, secret scanning |
| Tooling | [Vite+](https://viteplus.dev/) — Oxfmt, Oxlint, type checks in one pass |
| Tests | [Playwright](https://playwright.dev/) E2E + `bun test` units |
| Runtime | [Bun](https://bun.sh/) 1.4.0, Node 26.8.1 |

## Quick start

```bash
git clone https://github.com/piyush97/PiyushMehta.com.git
cd PiyushMehta.com
bun install
cp .env.example .env
bun dev                  # http://localhost:4321
```

The site runs without credentials. Routes that need a service degrade explicitly rather than crashing — reactions read as zero, contact and newsletter return 503 when Resend is unconfigured. Contact rate-limits in memory; newsletter and reactions use Redis.

## Scripts

```bash
bun dev                  # Dev server
bun run build            # Full pipeline (see below)
bun run preview          # Serve the build in the local Workers runtime
bun run deploy           # Build + deploy with varlock-managed secrets

bun run check            # Format, lint, and type checks (astro sync + varlock codegen first)
bun run check:write      # Same, applying fixes
bun run lint             # Oxlint only
bun run format           # Oxfmt write mode
bun run ci               # Read-only check for CI

bun test                 # Playwright, all projects
bun run test:smoke       # tests/portfolio-smoke.spec.ts only
bun run test:ui          # Playwright UI mode
bun run test:report      # Open the last HTML report

bun run migrate:images   # Copy post-local images into public/blog/
bun run cf:types         # Regenerate Cloudflare Worker types
bun run doctor           # react-doctor
```

`bun run build` is `scripts/build.mjs`, not a bare `astro build`:

| Step | Purpose | Required |
|---|---|---|
| Type generation | `varlock codegen` — regenerates `src/varlock.env.d.ts` | yes |
| Image migration | Copies `src/content/blog/<slug>/images/` into `public/blog/` | yes |
| Astro build | Static pages + Worker bundle | yes |
| Legacy blog redirects | Appends old capitalised slugs to `dist/client/_redirects` | yes |
| OG image coverage check | Fails on missing or fallback-sized social cards | yes |
| Pagefind search index | Indexes `dist/client` | optional |
| Resume PDF | Renders `/resume` with Playwright Chromium | optional |

Image migration rewrites MDX image paths in place. Check `git status` after an image-heavy build.

## Environment

[`.env.schema`](.env.schema) is the contract — every variable carries a type, sensitivity marker, and description, and varlock validates it on every dev and build start. `.env.example` still lists variables from removed integrations; trust the schema.

Consumed at runtime:

| Variable | Needed for | Without it |
|---|---|---|
| `RESEND_API_KEY` | Contact form, newsletter | Both return 503 |
| `RESEND_SEGMENT_ID` | Newsletter audience | Signup fails |
| `RESEND_FROM` | Confirmation email | Signup succeeds, no email |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Contact delivery | Falls back to defaults |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Newsletter rate limiting, reaction counts | Reactions read as zero and refuse writes; newsletter refuses signups |
| `SENTRY_DSN` / `PUBLIC_SENTRY_DSN` | Error tracking | Sentry stays off |

Never edit `src/varlock.env.d.ts` by hand — regenerate with `bun run check`.

## Writing a post

Posts live at `src/content/blog/<slug>/index.mdx`, images alongside in `images/`.

```yaml
---
title: 'Post Title'              # required
date: 2026-01-15                 # required
description: 'One-line summary'
tags: ['react', 'typescript']
author: 'Piyush Mehta'           # defaults to this
draft: false                     # true hides it from listings, tags, RSS, sitemap
ogTemplate: 'tech'               # default | minimal | tech | blog | modern | professional
ogTheme: 'dark'                  # dark | light | retro
image:
  url: '/blog/post-slug/images/cover.png'
  alt: 'Cover image description'
---
```

Reference images as `/blog/<slug>/images/...`. The build copies them; `public/blog/**` is a mirror, not a source.

MDX can import React components from `src/components/blog/` — quizzes, architecture diagrams, comparison tables, live demos.

## Structure

```
/
├── .env.schema                  # Env contract (varlock)
├── astro.config.mjs             # Adapter, integrations, aliases, chunking
├── vite.config.ts               # Vite+ format/lint/typecheck policy
├── lefthook.yml                 # Pre-commit: react-doctor, vp check, varlock scan
├── playwright.config.ts         # 5 browser projects, dev server on :4321
├── scripts/                     # build.mjs and friends
├── public/                      # Static assets, mirrored blog images
├── tests/                       # 13 Playwright specs + 2 unit suites
└── src/
    ├── components/              # 27 components (15 Astro, 12 React)
    │   └── blog/                # Interactive MDX components
    ├── content/blog/            # 39 posts
    ├── content.config.ts        # Frontmatter schema
    ├── data/portfolio.ts        # Typed project and case-study data
    ├── layouts/Layout.astro     # Shell: SEO, nav, footer, theme, ClientRouter
    ├── middleware/security.ts   # Response security headers
    ├── pages/
    │   ├── api/                 # The four Worker routes
    │   ├── blog/                # Listing, [slug], tag pages
    │   └── og/                  # Prerendered social cards
    ├── scripts/site-motion.ts   # Transition-aware reveal and parallax
    ├── styles/global.css        # Tailwind entry, tokens, themes
    └── utils/                   # Newsletter, SEO/schema, social cards
```

## Testing

```bash
bunx playwright test tests/portfolio-smoke.spec.ts --project=chromium
bun test tests/newsletter.test.ts
```

Start with the narrowest spec on Chromium; widen to the other four projects only for compatibility-sensitive work. Accessibility specs assert zero critical Axe findings, which is a floor, not full WCAG conformance.

The suite is not a clean gate — some legacy specs target routes and selectors that no longer exist, and `simple.spec.ts` points at production. Validate the behaviour you changed and report that scope honestly.

## Deployment

Cloudflare Workers Static Assets on the Free plan, via the Workers Builds GitHub integration:

```
main ──> Workers Builds ──> bun run check && bun run build ──> wrangler deploy
```

GitHub Actions ([`ci-cd.yml`](.github/workflows/ci-cd.yml)) runs quality, build, and security-config jobs but does not deploy. Runtime credentials live in the Worker's Variables and Secrets, never in Actions.

For manual deploys, `bun run deploy` uploads sensitive values as Cloudflare secrets and the rest as plain Worker variables.

## Contributing

PRs welcome. Bun only — no npm, pnpm, or Yarn lockfiles.

```bash
bun install --frozen-lockfile
git checkout -b feature/your-feature
# ...
bun run check                      # do this before pushing
git commit -m 'feat: description'  # pre-commit hooks run react-doctor, Vite+, varlock scan
git push origin feature/your-feature
```

Match the conventions already in the file you are editing rather than introducing a second one. [`AGENTS.md`](AGENTS.md) documents these in detail.

## Support

[Sponsor on GitHub](https://github.com/sponsors/piyush97) if this is useful to you.

## License

MIT — see [LICENSE](LICENSE)

---

[piyushmehta.com](https://piyushmehta.com) · [@piyush97](https://github.com/piyush97) · [LinkedIn](https://linkedin.com/in/piyush24) · [X](https://twitter.com/piyushmehtas)
