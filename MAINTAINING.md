# MAINTAINING.md — piyushmehta.com

Maintenance runbook for the [PiyushMehta.com](https://github.com/piyush97/PiyushMehta.com)
repository — personal website and blog for Piyush Mehta, built with **Astro 7.x**
(SSR), **TypeScript 6.x**, **React 19** islands, **MDX**, **Tailwind CSS v4**,
deployed to **Vercel** (ISR, 24h expiration).

## Local development

Runtime: **Bun** is the only supported package manager (`packageManager: bun@1.3.13`).

```bash
bun install          # install dependencies (bun.lock is the lockfile)
bun run dev          # start dev server on http://localhost:4321
bun run preview      # preview a production build
```

## CI commands

The repo's gate is `bun run check` (the `ci-cd.yml` workflow runs it before the
build). Run it locally before pushing:

```bash
bun run check        # astro sync + varlock typegen + Vite+ format/lint/type checks (read-only)
bun run check:write  # same, but auto-fix
bun run build        # full pipeline: typegen → images → astro → pagefind → sitemap → RSS
bun run lint         # Oxlint only
bun run format       # Oxfmt only
```

The full build is orchestrated by `scripts/build.mjs` (typegen, image migration,
Astro build, Pagefind index, enhanced sitemap, static RSS, resume PDF).

### Tests (Playwright)

```bash
bun run test             # full Playwright suite (3 browsers + 2 mobile)
bun run test:smoke       # smoke tests only
bun run test -- --project=chromium   # single browser
node tests/newsletter.test.ts        # newsletter unit tests (node:test)
bun run test:report      # HTML report
```

Playwright is the only test framework — no Jest/Vitest. E2E is currently
commented out in `ci-cd.yml`; run tests locally after changes that affect
rendering or interactivity.

## Dependency updates — KEEP BOTH mechanisms

Two complementary automation tracks are intentionally kept:

| Mechanism | Cadence | Scope | PR shape |
|---|---|---|---|
| **Dependabot** (`.github/dependabot.yml`) | Weekly, Mon 06:00 UTC | `npm` ecosystem (handles `bun.lock`) + `github-actions` | Granular per-package PRs, grouped minor+patch into `bun-minor-patch`, labeled `dependencies` |
| **`dependency-updates.yml` workflow** | Weekly, Mon 09:00 UTC | Bulk `bun update` | Single PR "chore: weekly dependency updates" labeled `dependencies`/`maintenance`/`automated` |

**Do not delete either one.** Dependabot is the primary path (precise,
per-package, reviewable); the workflow is the bulk fallback. They run on the
same day at different hours to reduce overlap. Dependabot's
`open-pull-requests-limit: 5` caps concurrent PRs; if the two ever produce
conflicting PRs in the same week, merge the Dependabot granular PRs first and
let the workflow PR handle only what remains.

### Reviewing a dependency PR

1. Check CI on the PR — `ci-cd.yml` must be green.
2. For grouped Dependabot PRs, scan the diff for breaking major bumps
   (Dependabot groups only minor+patch, so majors arrive as individual PRs).
3. Merge with **squash**. Delete the branch.
4. After merge, confirm the default-branch run of `ci-cd.yml` is green.

## Stale policy

`.github/workflows/stale.yml` (weekly, `actions/stale@v11`):

- **Issues**: stale after 60 days of inactivity — labeled `stale` only, **never
  auto-closed** (`days-before-issue-close: -1`).
- **PRs**: stale after 30 days — labeled `stale` only, **never auto-closed**.
- Dependabot PRs are exempt via `exempt-pr-labels: dependencies`.

Stale items stay open; a comment or any activity clears the stale label
automatically.

## Environment variables

All environment variables are declared in `.env.schema` (varlock `@env-spec`
format) and type-checked via `@varlock/astro-integration`:

```bash
bunx varlock typegen   # regenerate src/varlock.env.d.ts from .env.schema
bunx varlock scan      # validate local .env against .env.schema
```

- `@optional` / `@required` — presence
- `@sensitive` — secrets (excluded from client bundles)
- `@type=url|number|boolean|email` — coercion
- Public vars are prefixed `PUBLIC_` (e.g. `PUBLIC_SENTRY_DSN`)

Never hardcode secrets; add any new variable to `.env.schema` first, then
`bunx varlock codegen` (part of `bun run check`).

## Release / verification steps

1. Branch from `main` (e.g. `chore/foo` or `fix/bar`).
2. Make changes; add/update Playwright tests in `tests/` for behavior changes.
3. `bun run check` — format, lint, and type checks must pass.
4. `bun run build` — full pipeline must produce `dist/`.
5. Push and open a PR; wait for `ci-cd.yml` (Code Quality → Build Verification →
   Security Configuration Check) plus CodeQL and Dependency Review to pass.
6. Merge with **squash**; Vercel deploys automatically from `main`.
7. After deploy, spot-check the live site: blog post, homepage, and one API
   route (e.g. `/api/reactions`).

## Contact / ownership

- Maintainer: Piyush Mehta (piyush97)
- Issues/PRs welcome; see the `Contributing` section in the README and the
  pull request template in `.github/pull_request_template.md`.
