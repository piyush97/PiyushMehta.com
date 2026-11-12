# 003 — Gate production dependencies on a `bun audit` baseline

**Read this whole file before touching anything.** All context is inlined. If reality does not match, stop and report (STOP conditions).

**Drift check first**: `git diff --stat 0000186..HEAD -- package.json bun.lock .github/workflows/ci-cd.yml` — if dependencies changed since this plan was written, re-run `bun audit --prod` before trusting the numbers below.

## Status

- **Priority**: P2
- **Effort**: S (2-4 hours, mostly triage; the CI line is one step)
- **Risk**: LOW — a lockfile bump plus a CI step; no application code changes
- **Depends on**: none
- **Category**: dependencies
- **Planned at**: `0000186`, 2026-11-12
- **Issue**: none

## Why

`bun audit --prod` currently reports **24 advisories: 8 high, 12 moderate, 4 low**. Nothing in CI runs an audit, and nothing in the repo records a decision about them, so the next real advisory ships silently and the backlog only grows. Two of the high-severity items are plausibly on the runtime path (`undici`, used by the AI SDK's fetch stack that runs inside the Worker) and one is on the build path (`sharp`, used to render social cards).

Two outcomes matter: fix or consciously accept today's advisories, and make a regression impossible to miss.

## Current state — measured, not guessed

Captured with Bun 1.4.4 on `0000186`:

```
bun audit --prod
24 vulnerabilities (8 high, 12 moderate, 4 low)
```

High-severity items and where they appear:

| Package  | Affected range    | Copies resolved in this tree           | Note                                                                                                                                                         |
| -------- | ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `undici` | `>=7.0.0 <7.30.1` | `7.29.0`, `7.29.1`, `8.12.2`, `7.30.1` | pulled via `@ai-sdk/provider-utils@5.0.62` (`^7.29.0`), which the `ai` / `@ai-sdk/*` chain depends on — runtime                                              |
| `sharp`  | `<0.35.5`         | `0.35.2`                               | arrives through `@varlock/cloudflare-integration` → `@cloudflare/vite-plugin` → `miniflare`; also `@img/sharp-*` 0.35.5 platform packages exist — build path |

Full audit also includes dev-only chains that are not part of this plan (`tinypool` critical via `vite-plus`/`oxfmt`, `node-forge` via `jks-js`, `basic-ftp`, `express`/`body-parser` via `promptfoo`, `msal-node` via promptfoo). They never ship to the Worker; do not chase them here.

CI today (`.github/workflows/ci-cd.yml`): Code Quality installs with `bun install --frozen-lockfile`, runs `bun run check` and `bun run test:unit`; the Build job runs `bun run check:posts`, `bun run build`, `bun run check:release`. **No audit step anywhere.**

`bun audit` flags available (verified with `bun audit --help`): `--audit-level=<low|moderate|high|critical>`, `-p/--prod`, `--ignore=<GHSA,...>`, `--json`, `--dry-run`.

## Environment

| Purpose                   | Command                                                                        | Expected                                                  |
| ------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Audit production tree     | `bun audit --prod`                                                             | prints advisories, exit status depends on `--audit-level` |
| Machine-readable snapshot | `bun audit --prod --json`                                                      | JSON                                                      |
| Dependency chain          | `bun why <pkg>`                                                                | chain for every resolved copy                             |
| Install                   | `bun install --frozen-lockfile`                                                | exit 0                                                    |
| Full gate                 | `bun run check && bun run test:unit && bun run build && bun run check:release` | exit 0                                                    |

Never run `bun audit fix --latest` blindly — it rewrites across major versions in one shot.

## Scope

**In scope**

- `package.json` (add `overrides` only where actually needed)
- `bun.lock` (via `bun install`, never hand-edited)
- `.github/workflows/ci-cd.yml` (one step in the Code Quality job)
- `docs/MAINTAINING.md` or `MAINTAINING.md` (one short paragraph recording the policy and any accepted advisory)
- `docs/plans/README.md` status

**Out of scope**

- Application source under `src/`. If a fix requires code changes, stop and report.
- Dev-only advisories (`tinypool`, `node-forge`, `promptfoo` chain). Record them, do not fix them.
- Bumping Astro, React, or the AI SDK across majors.
- Adding a new CI service, Dependabot config change, or a scheduled workflow.

## Steps

### 1. Snapshot and triage

```
bun audit --prod --json > /tmp/opencode/audit-before.json
bun audit --prod
bun why undici
bun why sharp
```

For every **high** advisory, write down: GHSA id, package, which resolved copy is in the production tree, and whether that copy can actually execute inside the Worker. A package that only runs in Node during `bun run build` is still worth fixing, but classify it separately — it changes the risk framing, not the fix.

**Verify**: you can state, per high advisory, "runtime in Worker" or "build/dev only".

### 2. Fix what a patch bump fixes

1. `bun update` (in-range only; no `--latest`).
2. Re-run `bun audit --prod`. If `undici` copies below `7.30.1` remain, add a narrow override rather than a broad one:

```jsonc
// package.json
"overrides": {
  "undici": "7.30.1"
}
```

then `bun install` and confirm `bun why undici` no longer lists a resolved copy below `7.30.1`. 3. For `sharp 0.35.2`, prefer letting the parent range resolve upward (`bun update sharp`, or override `"sharp": "0.35.5"` if the parent pins below the advisory threshold). 4. After each change run `bun run build` — these packages are exercised during the build (`@resvg/resvg-js`/`sharp` render social cards), so a broken native binary shows up there, not in unit tests.

**Verify**: `bun audit --prod` shows zero `high`, and `bun run build` exits 0 with `dist/` produced.

If a high advisory cannot be fixed without a major bump or a code change, do **not** suppress it with `--ignore` in this step: leave it, and handle it through the ignore list in step 3 with a written rationale.

### 3. Add the CI gate

In `.github/workflows/ci-cd.yml`, in the **Code Quality** job, after `bun install --frozen-lockfile` and before `bun run check`, add a step:

```yaml
- name: Production dependency audit
  run: bun audit --prod --audit-level=high
```

Rules for this step:

- `--prod` only. Dev-only advisories must not block a deploy.
- `--audit-level=high`. Moderate and low are reported by the weekly glance, not gated.
- If, after step 2, one or more high advisories remain that are genuinely unreachable, add them one at a time to the step with `--ignore=<GHSA-id>` **and** record each id, its package, and the reason in a short "Accepted advisories" list in `MAINTAINING.md` or `docs/MAINTAINING.md` (whichever is the live one — check which file `AGENTS.md` references; `docs/MAINTAINING.md` exists and `MAINTAINING.md` is at repo root).

Use the `--ignore` form `GHSA-xxxx-yyyy-zzzz` (one flag per id, or comma-separated — verify with `bun audit --ignore=GHSA-... --prod --dry-run` that it is actually honoured before committing).

**Verify**: with an artificial `--audit-level=critical` and the real tree, the step exits 0; with `--audit-level=high` and a temporarily reverted override it exits non-zero (prove the gate bites by reverting one override, running the command locally, then restoring).

### 4. Record the policy

Add 3-5 lines to the maintenance doc: gate level, prod-only scope, where accepted advisories live, and the fact that dev-only findings are triaged per release rather than per PR.

## Test plan

- No new unit tests. The gate is the test.
- Existing suites must stay green: `bun run test:unit` (300), `bun run build`, `bun run check:release`.
- Manual proof in step 3 that the new CI step fails on a known-bad tree and passes on the fixed one.

## Done criteria

- `bun audit --prod --audit-level=high` exits 0 locally.
- `bun audit --prod` high count is `0`, or every remaining high is listed with a GHSA id and a rationale in the maintenance doc and ignored explicitly in CI.
- `.github/workflows/ci-cd.yml` contains the new step in the Code Quality job.
- `bun run build` and `bun run check:release` exit 0.
- `bun.lock` changes only from `bun install`/`bun update` (no manual edits).
- No `src/` changes.

## STOP conditions

Stop and report if:

- Fixing a high advisory requires upgrading a major version of `@astrojs/cloudflare`, `astro`, `react`, `@sentry/*`, or the `ai`/`@ai-sdk/*` family.
- An override causes `bun run build` to fail and the failure is not a straightforward version-range problem after one retry.
- `bun why` shows a vulnerable copy vendored inside an already-published bundle that overrides cannot reach.
- `bun audit --prod --audit-level=high` passes locally but the CI step behaves differently (different Bun version resolution) — report the discrepancy instead of loosening the gate.

## Maintenance

- The audit step runs on every PR; expect it to surface newly published advisories. Treat a red audit as a same-week fix, not a merge blocker when the advisory is dev-only (the scope is already `--prod`).
- Overrides are sticky: when the parent range catches up, remove the override and let the lockfile resolve naturally.
- `undici` is deeply nested; after any `ai`/`@ai-sdk` upgrade re-run `bun why undici` and drop the override if it is no longer needed.
- Dependabot/agent PRs that touch `package.json` will re-trigger this gate — that is intentional.
