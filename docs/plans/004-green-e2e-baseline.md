# 004 — Restore a green E2E baseline and gate it in CI

**Read this whole file before touching anything.** All context is inlined. If reality does not match, stop and report (STOP conditions).

**Drift check first**: `git diff --stat 0000186..HEAD -- tests .github/workflows/ci-cd.yml playwright.config.ts` and `git status --short` — if specs or the workflow changed since, re-run the baseline command in step 1 and use your own numbers. Note: `tests/migration-smoke.spec.ts` and `tests/public-surfaces.spec.ts` were already modified but uncommitted at planning time, so re-run before trusting the table below.

## Status

- **Priority**: P2
- **Effort**: M (half a day to a day: 13 red tests, then one CI step)
- **Risk**: LOW — test-only changes plus one workflow step; product code is out of scope unless a test proves a real regression
- **Depends on**: none
- **Category**: tests
- **Planned at**: `0000186`, 2026-11-12
- **Issue**: none

## Why

CI runs three of roughly twenty Chromium specs (`.github/workflows/ci-cd.yml`, E2E job: `article-orientation.spec.ts`, `lab.spec.ts`, `post-ask.spec.ts`). The rest are dead weight: nothing verifies them, so they have rotted. Running the remaining 19 spec files locally on Chromium gave **101 passed, 13 failed, 4 skipped**.

Every failure I inspected is a stale expectation, not a product bug — mostly trailing-slash URLs that the deployment has not emitted for some time (`wrangler.jsonc` sets `html_handling: "drop-trailing-slash"`, and `public/_redirects` writes slashless targets such as `/blog/kubernetes-docker`). The specs encode the old URL shape, which is exactly what happens to tests no one runs.

Result to reach: the whole Chromium suite green locally, and CI gating that green set so it stays that way.

## Current state

Measured on `0000186`, Chromium only, `bunx playwright test --project=chromium` across 19 spec files:

```
101 passed (2.2m)
13 failed
4 skipped
```

Failing tests by file:

| Spec                                 | Failing test                                                              | Observed cause                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tests/homepage-revamp.spec.ts`      | `renders the approved evidence-led hero`                                  | expects `href="/blog/"`, page has `/blog`                                                                  |
| `tests/homepage-revamp.spec.ts`      | 3 viewport overflow tests (mobile / small mobile / tablet)                | same spec's link-shape setup                                                                               |
| `tests/traffic-growth.spec.ts`       | `readers can reach consulting and recruiting information from an article` | expects `href="/resume/"`, page has `/resume`                                                              |
| `tests/traffic-growth.spec.ts`       | `crawler discovery URLs agree with canonical HTML`                        | same                                                                                                       |
| `tests/blog-reading-paths.spec.ts`   | `renders three collection-backed journeys in source order` (line 60)      | expects `` `/blog/${slug}/` ``                                                                             |
| `tests/article-continuation.spec.ts` | `renders one truthful next read…` (line 45)                               | regex `^\/blog\/[^/]+\/$`                                                                                  |
| `tests/migration-smoke.spec.ts`      | `blog filter reinitializes after client-side navigation`                  | navigates to `/blog/` and asserts URL contains `/blog/`                                                    |
| `tests/migration-smoke.spec.ts`      | `PWA icons and legacy tag links resolve`                                  | same shape                                                                                                 |
| `tests/integration.spec.ts`          | `should work with JavaScript disabled` (line 203)                         | `expect(href).toBe('/projects/')`                                                                          |
| `tests/portfolio-smoke.spec.ts`      | `FocusTube appears as a project and links to its technical article`       | content drift — verify whether the project still exists in `src/data/portfolio.ts`                         |
| `tests/public-surfaces.spec.ts`      | `projects exposes a scannable case index…`                                | `a[href="/about"][aria-current="page"]` count 0 — verify whether other assertions in the file are affected |

Relevant config:

- `playwright.config.ts:5` — `testMatch: '**/*.spec.ts'`; `*.test.ts` files are `node:test` unit tests and are not picked up here.
- `playwright.config.ts:40+` — `webServer` runs `ASTRO_DEV_BACKGROUND=1 bun dev` on http://localhost:4321, `reuseExistingServer` outside CI.
- `astro.config.mjs:18` — `trailingSlash: 'ignore'`. Canonical output is slashless (Workers Assets drops the trailing slash); slash URLs still resolve.

Canonical decision for this plan: **slashless** (`/blog`, `/blog/<slug>`, `/resume`, `/projects`). Evidence: `wrangler.jsonc` assets `html_handling: "drop-trailing-slash"`, `public/_redirects` targets, and the `dist/client` route layout. Do not flip the site to trailing slashes for tests.

## Environment

| Purpose             | Command                                                        | Expected |
| ------------------- | -------------------------------------------------------------- | -------- |
| Full Chromium suite | `bunx playwright test --project=chromium --reporter=line`      | 0 failed |
| Single spec         | `bunx playwright test tests/<name>.spec.ts --project=chromium` | 0 failed |
| Unit tests          | `bun run test:unit`                                            | exit 0   |
| Typecheck/lint      | `bun run check`                                                | exit 0   |

Other projects (`firefox`, `webkit`, `mobile-chrome`, `mobile-safari`) exist but are not gated and are not part of this plan.

## Scope

**In scope**

- `tests/*.spec.ts` — assertion and navigation-helper updates listed above
- `.github/workflows/ci-cd.yml` — the Chromium E2E step's spec list
- `docs/plans/README.md` status

**Out of scope**

- `src/` product code. If a failing test proves a real product regression, stop and report it; do not "fix" the product inside this plan.
- `playwright.config.ts` project matrix, retries, workers.
- Firefox/WebKit/mobile projects.
- Deleting specs. Quarantine with `test.fixme` plus a comment if a test encodes genuinely wanted behavior that no longer exists.

## Steps

### 1. Re-establish the baseline

```
bunx playwright test --project=chromium --reporter=line 2>&1 | tail -40
```

Confirm the failing set matches the table above (some entries may already be fixed). Note the exact count; you need it for the done criteria.

**Verify**: you have your own pass/fail list.

### 2. Fix URL-shape expectations

Update every assertion that hard-codes a trailing slash, and every navigation helper that navigates to a slash URL where the test then asserts on the URL. Files and sites:

- `tests/homepage-revamp.spec.ts:24,28,40` — link lists containing `'/blog/'`, `'/resume/'`, `'/projects/'`.
- `tests/traffic-growth.spec.ts:33` — `'/resume/'` → `'/resume'`; the discovery test above it compares crawler URLs to canonical HTML, so fix the canonicalization helper rather than one assertion at a time.
- `tests/blog-reading-paths.spec.ts:60` — `` `/blog/${slug}/` `` → `` `/blog/${slug}` ``. Lines 38/81/108 use `page.goto('/blog/')`; leave navigation as-is if the redirect works, but change any assertion on `page.url()`.
- `tests/article-continuation.spec.ts:45` — regex `^\/blog\/[^/]+\/$` → `^\/blog\/[^/]+$`; check line 78's `toHaveURL` regex for the same issue.
- `tests/migration-smoke.spec.ts:24` — `expect(page.url()).toContain('/blog/')` → assert the slashless path (prefer `new URL(page.url()).pathname === '/blog'`); check the `navigateViaNav('/blog/')` helper and its caller at lines 103/115/123 stays consistent.
- `tests/integration.spec.ts:203` — `expect(href).toBe('/projects/')` → `'/projects'`.
- `tests/conversions.spec.ts:16,24`, `tests/motion.spec.ts:36`, `tests/ask-piyush.spec.ts:268` use slash URLs for navigation only; leave them unless they assert on the resulting path.

Prefer comparing a normalized pathname over comparing raw `href` strings where the test's intent is "links to the blog", so the next URL-shape change does not break a dozen specs again. Where the test genuinely asserts a literal href (for example a download link `'/resume.pdf'`), keep the literal.

**Verify**: `bunx playwright test tests/homepage-revamp.spec.ts tests/traffic-growth.spec.ts tests/blog-reading-paths.spec.ts tests/article-continuation.spec.ts tests/migration-smoke.spec.ts tests/integration.spec.ts --project=chromium` → 0 failed.

### 3. Triage the content-drift failures

These two need a decision, not a mechanical edit:

1. `tests/portfolio-smoke.spec.ts:122` — "FocusTube appears as a project…". Check `src/data/portfolio.ts` (the active project data source). If FocusTube was intentionally removed, delete the test and say so in the commit message. If it is still listed, the UI is wrong: stop and report.
2. `tests/public-surfaces.spec.ts:21` — `a[href="/about"][aria-current="page"]` resolves to 0. Inspect the rendered `/projects` page. If `aria-current` is genuinely missing on the active nav link, that is an accessibility regression — stop and report. If the selector is stale (different href), correct the selector.

Do not weaken an accessibility assertion to make it pass; that class of failure belongs in a bug report.

**Verify**: each of the two specs passes, or is quarantined with `test.fixme` plus a one-line reason, or has been reported as a product bug.

### 4. Gate the green set in CI

Edit `.github/workflows/ci-cd.yml`, the `E2E Smoke (Chromium)` job's test step (`bunx playwright test tests/article-orientation.spec.ts tests/lab.spec.ts tests/post-ask.spec.ts --project=chromium`).

Replace the three explicit files with the full green set — list them explicitly, one per line using a YAML `run: |` block, or glob `tests/*.spec.ts` if and only if step 1's full run is now green. Prefer the glob once green: it prevents this exact drift from recurring. Keep `--project=chromium` and keep the artifact upload step unchanged.

If any test had to be quarantined in step 3, use the glob anyway — `test.fixme` keeps it from failing CI — and note the quarantine in the plan status.

Then prove the gate is real: introduce a temporary failing assertion, run CI-equivalent locally (`CI=true bunx playwright test --project=chromium`), confirm non-zero exit, and restore.

**Verify**: `CI=true bunx playwright test --project=chromium --reporter=line` → 0 failed, and the workflow diff shows the new spec selection.

### 5. Full re-run

Run the complete suite once more after all edits and record the summary line in your report.

## Test plan

- No new tests. This plan repairs and gates existing ones.
- Regression guard against future URL-shape drift: wherever you replaced a literal with a normalized pathname comparison, that is the durable form — prefer it over string equality.
- After this lands, adding a spec automatically adds it to CI (glob), so a red spec is caught the day it appears.

## Done criteria

- `CI=true bunx playwright test --project=chromium` exits 0 with 0 failed (skipped/quarantined allowed only where documented in the status line).
- `.github/workflows/ci-cd.yml` E2E step no longer hard-codes three filenames.
- `grep -rn "'/blog/'\|'/resume/'\|'/projects/'" tests/*.spec.ts` shows no remaining href assertions with a trailing slash (navigation calls may remain).
- `bun run test:unit` and `bun run check` exit 0.
- No `src/` files modified.
- `docs/plans/README.md` status updated.

## STOP conditions

Stop and report if:

- A failure is not explainable by URL shape or content drift and looks like a real product regression (console errors, missing content, broken interaction).
- `public-surfaces.spec.ts`'s `aria-current` assertion is correct and the page genuinely lost `aria-current`.
- The full suite is not green after your fixes and the remaining failures are flaky rather than deterministic (same test passing and failing across two runs).
- Gating all specs would push the E2E job well past its current runtime and you cannot measure it locally — report the measured duration instead of silently keeping three specs.

## Maintenance

- Once the glob is enabled, any new spec is CI-gated by default. Keep individual spec runtime reasonable; a slow spec is a reason to trim the spec, not to de-gate the suite.
- The trailing-slash class of failure can recur if URL policy changes again. The normalized-pathname pattern is the guard; this plan converts the assertions that mattered.
- Deliberately deferred: adding `firefox`/`webkit`/mobile projects to CI. They are unmeasured here and would multiply runtime; revisit only if cross-browser regressions appear.
- Related but separate: `tests/*.test.ts` unit tests already run in the Code Quality job via `bun run test:unit`.
