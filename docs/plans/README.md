# Handoff plans — index

Written by the `improve` skill on 2026-11-12 against commit `0000186`.

Each plan is self-contained: an executor model with no context from the audit session can read one file and execute it. Every plan opens with a drift check; if the named files changed since `0000186`, treat stale line numbers as a STOP condition rather than guessing.

**Working tree caveat**: at planning time the tree had uncommitted modifications to `src/middleware/security.ts`, `src/utils/request-security.ts`, `src/pages/api/*`, `tests/migration-smoke.spec.ts` and `tests/public-surfaces.spec.ts`. Line numbers in plans 001, 002 and 004 were read from that working tree, not from `0000186`. Re-read every cited file before editing; when a line number points at something else, follow the description, not the number. `public/_headers`, `.github/workflows/ci-cd.yml` and `playwright.config.ts` were clean.

Repo convention puts these under `docs/plans/` (which `.gitignore` whitelists) instead of a root `plans/` directory.

## Execution status

| Plan | Title                                                 | Priority | Effort | Depends on | Status |
| ---- | ----------------------------------------------------- | -------- | ------ | ---------- | ------ |
| 001  | [CSP report endpoint](001-csp-report-endpoint.md)     | P1       | S      | —          | DONE   |
| 002  | [Single-source CSP](002-single-source-csp.md)         | P1       | M      | 001        | DONE   |
| 003  | [Dependency audit gate](003-dependency-audit-gate.md) | P2       | S      | —          | DONE   |
| 004  | [Green E2E baseline](004-green-e2e-baseline.md)       | P2       | M      | —          | DONE   |

Status values: `TODO` | `IN PROGRESS` | `DONE` | `BLOCKED (reason)` | `REJECTED (reason)`. Executors update the row when the plan lands.

## Recommended order

1. **001** — smallest, unblocks the CSP work. The report endpoint is the instrument that makes 002 observable.
2. **002** — depends on 001. Tighten/align the two CSP definitions and add the drift guard.
3. **003** and **004** — independent, either order. 003 is a lockfile bump plus one CI step; 004 repairs 13 stale E2E specs and gates the suite.

## Why these four

Findings came from a `standard`-depth audit of routes, middleware, utils, build scripts, tests and CI. Ranked by leverage (impact ÷ effort, discounted by confidence):

1. The strict report-only CSP posts to `/api/csp-report`, which does not exist — so the site's own CSP-tightening backlog has no data. **HIGH confidence.**
2. Two enforced CSP definitions (code + `public/_headers`) have already drifted; `unsafe-eval` appears only in the static one. **MED confidence** on which one production serves — plan 002 verifies before editing.
3. `bun audit --prod` reports 24 advisories (8 high) and CI never audits. **MED confidence** on runtime reachability; the plan triages rather than assuming.
4. E2E CI gates 3 of ~20 Chromium specs; running the rest locally gives 101 passed / 13 failed, all stale URL-shape or content expectations. **HIGH confidence.**

## Considered and rejected

- Unauthenticated reaction counters with per-IP rate limits — intentional design for a cosmetic metric.
- The `hincrby(-1)` then `hset(0)` clamp in `src/pages/api/reactions.ts` — a benign race, low value.
- Contact/chat request validation, origin checks, body limits, fail-closed rate limiting — verified sound; no plan warranted.
- `@ts-ignore` / `as any` / TODO clusters in `src` — none found.
- Dev-only advisories (`tinypool`, `node-forge`, `promptfoo`, `msal-node`) — recorded in plan 003 as explicitly out of scope.

## Not audited

`src/components`, `src/utils/chat/*` internals, `scripts/*`, MDX content, accessibility/UX review, docs accuracy, and direction/roadmap ideas. A `deep` run should cover those.

## Execution notes (2026-11-12)

All four plans executed in the working tree; nothing committed.

- **001**: `src/pages/api/csp-report.ts` + `tests/csp-report.test.ts` added. `bun run test:unit` 307 pass.
- **002**: `public/_headers` aligned byte-for-byte with `CSP` in `src/utils/request-security.ts`, report-only + `Reporting-Endpoints` added to static pages, `unsafe-eval` removed (no local consumer found; preview smoke and `tests/lab.spec.ts` green). `tests/csp-policy.test.ts` guards parity.
- **003**: `sharp` and range-scoped `undici` overrides; `bun audit --prod` 24 → 4 advisories (0 high); `Production audit` step added to Code Quality; accepted-advisory table in `MAINTAINING.md`.
- **004**: full Chromium suite now 154 passed / 0 failed (1.8 min); CI runs `tests/*.spec.ts`. Three assertions were fixed inside files another agent had in flight (`tests/migration-smoke.spec.ts` nav literal + assets-only tag redirects, `tests/public-surfaces.spec.ts` h2 count and first-record name). **Caveat**: the E2E job still sets `continue-on-error: true`, so the wider suite reports but does not block merges. Removing that flag is a policy decision left to the owner.
