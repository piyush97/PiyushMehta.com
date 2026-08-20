# piyushmehta.com

Personal portfolio and blog. Built with Astro 7, React 19, Tailwind CSS v4, deployed on Vercel.

![](.github/demo.gif)

## Built with

| Tech | Role |
|---|---|
| [Astro](https://astro.build/) | Framework — SSR via Vercel adapter |
| [TypeScript](https://www.typescriptlang.org/) | Language |
| [React](https://react.dev/) | Interactive islands |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [MDX](https://mdxjs.com/) | Blog content |
| [Vercel](https://vercel.com/) | Deployment |

## Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 7](https://astro.build/) — SSR via Vercel adapter |
| UI | [React 19](https://react.dev/) — interactive islands |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite` |
| Language | TypeScript 7 |
| Content | MDX — blog posts with component support |
| Search | [Pagefind](https://pagefind.app/) — static full-text search |
| Email | [Resend](https://resend.com/) — contact form + newsletter (audience + confirmation) |
| Rate limiting | [Upstash Redis](https://upstash.com/) — serverless Redis |
| Monitoring | [Sentry](https://sentry.io/) — errors + performance |
| Analytics | Vercel Web Analytics + Speed Insights |
| Env management | [varlock](https://varlock.dev/) — schema validation + secret scanning |
| Code quality | [Vite+](https://viteplus.dev/) — Oxfmt + Oxlint + type checks |
| Testing | [Playwright](https://playwright.dev/) — E2E |
| Deployment | [Vercel](https://vercel.com/) |
| Package manager | [Bun](https://bun.sh/) |

## Local dev

**Requirements:** Node.js 22+, Bun

```bash
git clone https://github.com/piyush97/PiyushMehta.com.git
cd PiyushMehta.com
bun install
```

Pull environment variables from Vercel (requires `vercel link` first):

```bash
vercel env pull .env.local
```

Start dev server:

```bash
bun dev
```

→ `http://localhost:4321`

## Environment variables

All variables are documented in [`.env.schema`](.env.schema) with types, sensitivity markers, and descriptions. `varlock` validates them on every dev/build startup.

Key variables:

| Variable | Required | Purpose |
|---|---|---|
| `POSTGRES_URL` | Production | Newsletter DB |
| `RESEND_API_KEY` | Production | Contact form + email |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting |
| `PUBLIC_SENTRY_DSN` | Optional | Client error tracking |
| `SENTRY_DSN` | Optional | Server error tracking |
| `SENTRY_AUTH_TOKEN` | Build-time | Sourcemap upload |
| `GITHUB_TOKEN` | Optional | GitHub project showcase |

See `.env.schema` for the full list.

## Scripts

```bash
bun dev              # Dev server
bun build            # Production build (typegen → image migration → Astro build → Pagefind → resume PDF)
bun preview          # Preview production build locally

bun run lint         # Oxlint via Vite+
bun run lint:fix     # Oxlint auto-fix via Vite+
bun run format       # Oxfmt via Vite+
bun run check        # Vite+ format, lint, and type checks
bun run ci           # Read-only Vite+ check for CI

bun test             # Playwright E2E tests
bun run test:smoke   # Smoke tests only
bun run test:headed  # Tests in headed mode
bun run test:ui      # Playwright UI mode

bun run migrate:images    # Migrate blog images to public/
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
    │   ├── api/             # API routes (contact, newsletter, OG images)
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
- **Full-text search** — Pagefind, client-side, instant results
- **Dynamic OG images** — per-post generated via Satori + `@resvg/resvg-js`
- **Contact form** — Resend, CSRF protection, in-memory + Redis rate limiting
- **Newsletter** — multi-provider (Resend, Mailchimp, ConvertKit, Substack) with bot protection
- **Skip link** — keyboard accessibility, WCAG 2 AA
- **Structured data** — JSON-LD Person, Article, WebSite, BreadcrumbList schemas
- **Sitemap + RSS** — native `@astrojs/rss` and `@astrojs/sitemap` endpoints
- **Secret scanning** — varlock pre-commit hook blocks sensitive values in staged files

## Deployment

Deploys to Vercel automatically on push to `main`. Preview deployments on all PRs.

Build command: `bun run build`  
Output: `.vercel/output` (Vercel Build Output API)

## Contributing

Contributions are welcome! PRs are reviewed and preview deployments are created automatically for every pull request.

- **Install with Bun** — this repo uses [Bun](https://bun.sh/) exclusively (`bun@1.3.13`): `bun install`
- **Run the dev server** — `bun dev` → `http://localhost:4321`
- **Build locally** — `bun build` runs the full pipeline (typegen → image migration → Astro build → Pagefind → resume PDF)
- **Follow the existing style** — Vite+ (Oxfmt + Oxlint) format and lint are enforced via pre-commit hooks; run `bun run check` before pushing
- **PRs welcome** — keep changes scoped, update the README if behavior changes, and make sure tests pass (`bun test`)

**Maintenance:** see [MAINTENANCE.md](MAINTENANCE.md) — the consolidated handbook for all piyush97 profile repositories.

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: description"   # triggers Vite+ + varlock pre-commit hooks
git push origin feature/your-feature
# open PR → preview deploy created automatically
```

## Support / Sponsor

If you find this project useful, consider sponsoring:

[💖 Sponsor Piyush on GitHub Sponsors](https://github.com/sponsors/piyush97)

## License

MIT — see [LICENSE](LICENSE)

---

[piyushmehta.com](https://piyushmehta.com) · [@piyush97](https://github.com/piyush97) · [LinkedIn](https://linkedin.com/in/piyush24) · [X](https://twitter.com/piyushmehtas)
