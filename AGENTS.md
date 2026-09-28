# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-28
**Commit:** 713b091
**Branch:** main

## OVERVIEW
Personal portfolio and technical blog built with Astro server output on Cloudflare Workers, strict TypeScript, React islands, MDX, and Tailwind CSS v4. Core services: Resend, Upstash Redis, Satori/Resvg, Sentry, and Pagefind.

## STRUCTURE
```text
.
├── src/
│   ├── components/  # Shared Astro UI and React article demos
│   ├── content/blog/ # MDX posts and post-local images
│   ├── data/         # Typed portfolio content
│   ├── middleware/   # Active request security middleware
│   ├── pages/        # Static pages, feeds, APIs, social images
│   ├── scripts/      # Browser behavior
│   ├── styles/       # Tailwind entry, tokens, themes
│   └── utils/        # Contact, SEO, social-card logic
├── scripts/          # Build, image migration, PDF operations
├── tests/            # Playwright E2E and focused unit tests
└── public/           # Static assets and mirrored blog images
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Shared components and React demos | `src/components/` | Component guide: `src/components/AGENTS.md` |
| Routes, feeds, runtime endpoints | `src/pages/` | Route guide: `src/pages/AGENTS.md` |
| Blog schema and listing | `src/content.config.ts`, `src/pages/blog.astro` | Posts at `src/content/blog/<slug>/index.mdx` |
| Portfolio data | `src/data/portfolio.ts` | Active project data source |
| Shared shell and browser lifecycle | `src/layouts/Layout.astro` | Navigation, SEO, theme, ClientRouter |
| Contact and reactions | `src/pages/api/contact.ts`, `src/pages/api/reactions.ts` | Resend and Redis |
| Security headers | `src/middleware/security.ts` | Composed by `src/middleware/index.ts` |
| Build pipeline | `scripts/build.mjs` | Varlock, manifests, images, Astro, Pagefind |
| Env contract | `.env.schema` | Runtime callsites are authoritative |

## CODE MAP
LSP workspace queries were unavailable during guide generation; no reference counts asserted.
| Symbol / surface | Type | Location | Refs | Role |
|---|---|---|---|---|
| `Layout` | Astro layout | `src/layouts/Layout.astro` | — | Shared page shell |
| `blog` collection | Content collection | `src/content.config.ts` | — | Blog schema |
| `GET` / `POST` | API handlers | `src/pages/api/` | — | Runtime endpoints |
| `security` | Middleware | `src/middleware/security.ts` | — | Active response security |
| `build` | Script pipeline | `scripts/build.mjs` | — | Production build orchestration |

## CONVENTIONS
- Use Astro for server-rendered UI; add React islands only when interaction warrants it.
- For transition-aware browser behavior, initialize on `astro:page-load`.
- Keep API validation early; return explicit `Response` objects and preserve route-specific failure behavior.
- Prefer narrow dependency injection (`_fetch: typeof fetch = fetch`) over global containers.
- `.env.schema` plus runtime callsites define env requirements; examples may be stale.
- Publish post-local images as `/blog/<slug>/images/...`; `public/blog/**` mirrors source assets.
- Regenerate `src/varlock.env.d.ts` through `bun run check` or `bunx varlock codegen`.

## ANTI-PATTERNS (THIS PROJECT)
- Do not edit generated/ignored output in `dist/`, `.wrangler/`, `.astro/`, Playwright report/result directories, or `public/resume.pdf`.
- Do not treat `src/middleware/og-cache.ts` as active; `src/middleware/security.ts` is active.
- Do not use `bun build` or `bun test` for project scripts; they invoke Bun built-ins.
- Do not assume full E2E is a green gate: legacy OG, command-palette, reading-progress, and production-targeted specs are stale; E2E CI is commented out.

## UNIQUE STYLES
- Vite+ (`vp`) provides Oxlint/Oxfmt; no ESLint, Prettier, or Biome.
- TypeScript uses Astro strict mode; tests are excluded from formatter/linter.
- Blog post routes filter `draft: true` entries in `getStaticPaths`; drafts are not directly generated.
- Most pages are prerendered; API routes execute in the Worker.

## COMMANDS
```bash
bun install --frozen-lockfile
bun run dev
bun run check
bun run lint
bun run format
bun run build
bun run preview
bun run test
bun run test:smoke
bunx playwright test tests/<name>.spec.ts --project=chromium
bun run resume:generate  # after résumé source changes
```

## NOTES
- Package manager is Bun (`bun@1.3.13`); Node compatibility is 22.x.
- `scripts/build.mjs` can rewrite MDX image paths and copy images into `public/blog/`; inspect source changes after image-related builds.
- Résumé source is `src/assets/resume.pdf`.
- `src/pages/blog/[slug].astro` excludes drafts when generating routes; do not claim draft routes are emitted.
