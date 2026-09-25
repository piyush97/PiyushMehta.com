# piyushmehta.com

Personal portfolio and blog. Built with Astro 7, React 19, Tailwind CSS v4, deployed on Cloudflare Workers.

![](.github/demo.gif)

## Built with

| Tech | Role |
|---|---|
| [Astro](https://astro.build/) | Framework — prerendered pages plus Worker API routes |
| [TypeScript](https://www.typescriptlang.org/) | Language |
| [React](https://react.dev/) | Interactive islands |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [MDX](https://mdxjs.com/) | Blog content |
| [Cloudflare Workers](https://workers.cloudflare.com/) | Deployment |

## Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 7](https://astro.build/) — Cloudflare adapter |
| UI | [React 19](https://react.dev/) — interactive islands |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite` |
| Language | TypeScript 7 |
| Content | MDX — blog posts with component support |
| Search | [Pagefind](https://pagefind.app/) — static full-text search |
| Email | [Resend](https://resend.com/) — contact form delivery |
| Rate limiting | [Upstash Redis](https://upstash.com/) — serverless Redis |
| Monitoring | [Sentry](https://sentry.io/) — errors + performance |
| Analytics | Cloudflare Workers Observability |
| Env management | [varlock](https://varlock.dev/) — schema validation + secret scanning |
| Code quality | [Vite+](https://viteplus.dev/) — Oxfmt + Oxlint + type checks |
| Testing | [Playwright](https://playwright.dev/) — E2E |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com/) — Static Assets + API routes |
| Package manager | [Bun](https://bun.sh/) |

## Local dev

**Requirements:** Node.js 26.8.1, Bun 1.4.0

```bash
git clone https://github.com/piyush97/PiyushMehta.com.git
cd PiyushMehta.com
bun install
```

Create a local environment file from the checked-in template:

```bash
cp .env.example .env
```

Start dev server:

```bash
bun run dev
```

→ `http://localhost:4321`

## Environment variables

All variables are documented in [`.env.schema`](.env.schema) with types, sensitivity markers, and descriptions. `varlock` validates them on every dev/build startup.

Key variables:

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Production | Contact form delivery |
| `UPSTASH_REDIS_REST_URL` | Production for forms/reactions | Rate limiting and reaction counters |
| `UPSTASH_REDIS_REST_TOKEN` | Production for forms/reactions | Rate limiting and reaction counters |
| `PUBLIC_SENTRY_DSN` | Optional | Client error tracking |
| `SENTRY_DSN` | Optional | Server error tracking |
| `SENTRY_AUTH_TOKEN` | Build-time | Sourcemap upload |
| `GITHUB_TOKEN` | Optional | GitHub project showcase |

Legacy PostgreSQL, Substack, Mailchimp, and ConvertKit variables may remain in historical documentation but are not used by the current runtime. See `.env.schema` for the supported contract.

## Scripts

```bash
bun run dev              # Dev server
bun run build            # Production build pipeline (see scripts/build.mjs)
bun run preview          # Run the production build in the local Workers runtime
bun run deploy           # Build and deploy with varlock-managed Cloudflare secrets

bun run lint         # Oxlint via Vite+
bun run lint:fix     # Oxlint auto-fix via Vite+
bun run format       # Oxfmt via Vite+
bun run check        # Vite+ format, lint, and type checks
bun run check:release # Verify generated Worker/static release artifacts
bun run ci           # Read-only Vite+ check for CI

bun run test         # Playwright E2E tests
bun run test:smoke   # Smoke tests only
bun run test:headed  # Tests in headed mode
bun run test:ui      # Playwright UI mode

bun run migrate:images    # Migrate blog images to public/
bun run generate:posts   # Generate the published-post manifest
bun run check:posts      # Verify the published-post manifest
bun run test-seo          # Validate SEO meta files
```

## Project structure

```
/
├── .env.schema              # Env var schema (varlock)
├── astro.config.mjs         # Astro config
├── lefthook.yml             # Git hooks (Vite+ check + varlock scan)
├── public/                  # Static assets
├── scripts/                 # Build and maintenance scripts
└── src/
    ├── components/          # 42 UI components (Astro + React)
    ├── content/
    │   └── blog/            # MDX blog posts
    ├── layouts/
    │   └── Layout.astro     # Root layout with SEO, skip link
    ├── middleware/          # Request middleware
    ├── pages/
    │   ├── api/             # Runtime API routes (contact, reactions)
    │   ├── blog/            # Blog listing + post pages
    │   ├── index.astro      # Homepage
    │   ├── about.astro
    │   ├── projects.astro
    │   ├── resume.astro
    │   ├── uses.astro
    │   ├── videos.astro
    │   └── services.astro
    ├── styles/
    │   └── global.css       # Global styles + design tokens
    ├── types/               # TypeScript type definitions
    └── utils/               # OG generation, SEO helpers
```

## Blog post frontmatter

```yaml
---
title: "Post Title"
description: "Post description"
date: 2026-01-15
author: "Piyush Mehta"
tags: ["react", "typescript"]
ogTemplate: "tech"        # default | minimal | tech | blog
ogTheme: "dark"           # dark | light | retro
image:
  url: "/blog/post-slug/images/cover.png"
  alt: "Cover image description"
---
```

## Features

- **⌘K Command palette** — global search and navigation
- **Full-text search** — Pagefind static index, required when the search route ships
- **Build-time OG images** — per-post generated via Satori + `@resvg/resvg-js`
- **Résumé PDF** — a versioned source asset copied into the static release before Astro builds
- **Contact form** — Resend with origin validation and Upstash rate limiting
- **Skip link** — keyboard accessibility, WCAG 2 AA
- **Structured data** — JSON-LD Person, Article, WebSite, BreadcrumbList schemas
- **Sitemap + RSS** — native `@astrojs/rss` and `@astrojs/sitemap` endpoints
- **Secret scanning** — varlock pre-commit hook blocks sensitive values in staged files

## Deployment

Deploys to Cloudflare Workers with `bun run deploy`. Varlock uploads sensitive values as Cloudflare secrets and non-sensitive values as Worker variables.

Build command: `bun run build`

Output: `dist/client` static assets plus `dist/server` Worker modules

**Release contract:** the target deployment uses the generated `dist/server/wrangler.json` and serves only `dist/client` as public assets. Deploy and version uploads must go through `varlock-wrangler`, which injects the Varlock environment binding the generated Worker requires at startup; raw `wrangler` commands are not the production path. The versioned résumé asset is copied before Astro builds, so `dist/client/resume.pdf` is present without requiring Chromium in Workers Builds. Do not deploy the root `./dist` directory as a public asset root.

The production configuration uses only Workers Free products: Static Assets, lightweight API routes, custom domains, and included observability. Social cards and images are generated at build time rather than using Cloudflare Images or runtime rasterization.

### Cloudflare Workers Builds

Cloudflare's GitHub App owns deployment. Pull requests and non-production branches upload preview versions; pushes to `main` deploy production after the Cloudflare build succeeds. GitHub Actions remains the independent code-quality and build-verification gate and does not deploy.

Recommended Cloudflare build settings:

- Production branch: `main`
- Build command: `bun run check && bun run build`
- Deploy command: `bun run check:production-env && bunx varlock-wrangler deploy --config dist/server/wrangler.json`
- Version command: `bun run check:production-env && bunx varlock-wrangler versions upload --config dist/server/wrangler.json`
- Root directory: `/`
- Non-production branch builds: enabled
- Build cache: enabled

Runtime credentials remain in the Worker's Variables and Secrets settings; they are not stored in GitHub Actions.

## Contributing

Contributions are welcome! PRs are reviewed and validated by CI.

- **Install with Bun** — this repo uses [Bun](https://bun.sh/) exclusively (`bun@1.4.0`): `bun install`
- **Run the dev server** — `bun run dev` → `http://localhost:4321`
- **Build locally** — `bun run build` runs the repository build pipeline; inspect `scripts/build.mjs` for required release outputs
- **Follow the existing style** — Vite+ (Oxfmt + Oxlint) format and lint are enforced via pre-commit hooks; run `bun run check` before pushing
- **PRs welcome** — keep changes scoped, update the README if behavior changes, and make sure tests pass (`bun run test`)

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: description"   # triggers Vite+ + varlock pre-commit hooks
git push origin feature/your-feature
# open PR → CI validates checks and the production build
```

## Support / Sponsor

If you find this project useful, consider sponsoring:

[💖 Sponsor Piyush on GitHub Sponsors](https://github.com/sponsors/piyush97)

## License

MIT — see [LICENSE](LICENSE)

---

[piyushmehta.com](https://piyushmehta.com) · [@piyush97](https://github.com/piyush97) · [LinkedIn](https://linkedin.com/in/piyush24) · [X](https://twitter.com/piyushmehtas)
