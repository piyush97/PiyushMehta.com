# Maintaining piyushmehta.com

Astro 7, TypeScript 7, React 19 islands and Tailwind CSS 4 on Cloudflare Workers.
Most pages are prerendered; API routes and runtime-bound pages execute in the Worker.

## Local development

Use the Bun version in `package.json#packageManager` and Node version in `.node-version`.
`bun.lock` is the dependency lockfile.

```bash
bun install --frozen-lockfile
bun run dev
bun run preview
```

## Checks and tests

```bash
bun run check        # Astro sync, Varlock codegen, format/lint/type checks
bun run lint
bun run format
bun run test:unit
bun run build
bun run check:release
bunx playwright test --project=chromium
bun run test         # unit tests, then the Playwright suite
```

The build runs `scripts/build.mjs`: environment types, published-post manifest,
image processing, résumé asset copy, Astro, legacy redirects, discovery checks,
Pagefind and release validation. Feeds and sitemaps are Astro build outputs.
`src/assets/resume.pdf` is the canonical résumé; run `bun run resume:generate`
only after changing its source.

Unit tests use Bun's runner for the `node:test` files in `tests/*.test.ts`.
Playwright runs `*.spec.ts`. Do not substitute `bun build` for `bun run build`.

## Dependency updates

Dependabot is the only dependency updater. `.github/dependabot.yml` schedules
Bun-compatible `npm` and `github-actions` updates for Monday at 06:00 UTC.
Minor/patch package updates share the `bun-minor-patch` group; major updates stay
separate. Each ecosystem permits five open PRs.

The former bulk `bun update` workflow was removed: its write-capable token and
`GITHUB_TOKEN` PRs bypassed the intended PR-triggered validation path.

Review updates against `bun run check`, unit tests, the build and relevant E2E
coverage. Inspect major updates separately. Keep workflow actions SHA-pinned.
The `vite` override selects Vite+'s matching core; change it with Vite+ itself.

## Stale policy

`.github/workflows/stale.yml` labels issues after 60 days and PRs after 30 days.
Neither is automatically closed. Dependency PRs are exempt. Comment to reactivate.

## Environment and abuse limits

`.env.schema` defines the public/server environment contract. Regenerate
`src/varlock.env.d.ts` with `bunx varlock codegen` or `bun run check`; do not edit it.
Keep secrets in local ignored env files or Cloudflare Variables and Secrets, never
in commits or diagnostic payloads.

Contact requires a Turnstile proof with action `contact-form`, an exact hostname,
a per-IP limit and a 30-message daily site cap. Chat proofs use `chat-session`;
the actions are not interchangeable. IPv6 rate/session identities use a /64.
Missing limiter configuration, Redis errors and SDK timeout results fail closed.
The public Turnstile key is runtime-bound; GET `/api/chat/session` returns only
that public key. Contact submits JSON only after verification.

`/stats` requires HTTP Basic authentication with a password of at least 32 random
characters and applies a five-attempt/ten-minute address limit. Rotate its password
after any suspected exposure. Cloudflare log/trace sampling is 10%; retention is a
provider setting, not a Wrangler retention field.

## Release verification

1. Use a dedicated GitButler branch. Preserve other agents' working changes.
2. Run `bun run check`, `bun run test:unit`, `bun run build` and `bun run check:release`.
3. Run relevant Chromium tests, including discovery against the compiled Worker.
4. Publish only approved branches. Open a draft PR when requested; require CI.
5. Cloudflare Workers Builds deploys `main` with `dist/server/wrangler.json`.
6. Verify the deployed site, discovery, one article and the relevant API flow.

```bash
PLAYWRIGHT_BASE_URL=https://piyushmehta.com bunx playwright test tests/portfolio-smoke.spec.ts --project=chromium --grep 'security discovery'
```

Manual `bun run deploy` rejects tracked, staged and untracked source changes both
before and after the build. Git command failures also block it. Do not bypass the
guard or upload `dist/server/` as public static assets. GitHub Actions does not need
a production deployment token; Workers Builds uses its installed GitHub App.

## Ownership

Maintainer: Piyush Mehta (`piyush97`). Use the contributing guide and PR template
for review expectations. Production settings, credential rotation and media
removal require the maintainer's approval and verification.
