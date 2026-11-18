# 001 — Add the missing `/api/csp-report` collector

**Read this whole file before touching anything.** You are executing a handoff plan written by an advisor who is not available. All context you need is inlined. If reality does not match this plan, stop and report (see STOP conditions).

**Drift check first**: `git diff --stat 0000186..HEAD -- src/utils/request-security.ts src/pages/api tests` and `git status --short` — if those paths changed since the plan was written, re-read the current "Current state" lines before editing. Note: the working tree was already dirty at planning time, so line numbers came from the working tree copy; trust the descriptions. A mismatch in behavior is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S (2-3 hours)
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: `0000186`, 2026-11-12
- **Issue**: none

## Why

`src/utils/request-security.ts:10-11` ships a strict `Content-Security-Policy-Report-Only` policy and declares `Reporting-Endpoints: csp="/api/csp-report"`. No such route exists — `src/pages/api/` contains only `chat.ts`, `contact.ts`, `conversions.ts`, `reactions.ts`, `subscribe.ts`, `chat/`, `subscribe/`. Every violation the report-only policy detects is POSTed into a 404 and discarded.

That matters because the site's own hardening backlog wants to tighten the enforced CSP (`docs/plans/hardening-and-optimization.md`, item SEC-04) and needs violation data to know which directives are still needed. This endpoint is the prerequisite for that work: it converts the report-only policy from decoration into an instrument.

## Current state

- `src/utils/request-security.ts:9` — enforced `Content-Security-Policy` (from the `CSP` constant at line 5).
- `src/utils/request-security.ts:10` — `Content-Security-Policy-Report-Only`, ends with `report-uri /api/csp-report; report-to csp;`.
- `src/utils/request-security.ts:11` — `Reporting-Endpoints: csp="/api/csp-report"`.
- `src/utils/request-security.ts:35-36` — `json(data, status, headers)` helper; always sets `Cache-Control: no-store`.
- `src/utils/request-security.ts:143` — `readLimitedText(request, max)`; returns a string, or `null` when the body exceeds `max` bytes or declares an oversized `Content-Length`.
- `src/utils/request-security.ts:187` — `isAllowedFormOrigin(request)`; **do not use it here** (see below).
- `src/pages/api/reactions.ts:14` — `export const prerender = false;` pattern for runtime API routes.
- `src/pages/api/chat/session.ts` — a small route that shows the full shape: `prerender = false`, `json(...)`, `readLimitedText`, `limitOrUnavailable`.

Read those files before editing. Do not copy code out of this plan; the plan describes behavior, the repo files are the source of truth.

## Environment

| Purpose                | Command                         | Expected                                      |
| ---------------------- | ------------------------------- | --------------------------------------------- |
| Install (already done) | `bun install --frozen-lockfile` | exit 0                                        |
| Typecheck + lint       | `bun run check`                 | exit 0                                        |
| Unit tests             | `bun run test:unit`             | exit 0, currently 300 passing across 22 files |
| Formatter              | `bun run format`                | exit 0                                        |
| Dev server             | `bun run dev`                   | serves http://localhost:4321                  |

Package manager is Bun. Do not use ESLint, Prettier, or Biome — this repo uses Vite+ (`vp`) via `bun run lint` / `bun run format`.

## Scope

**In scope**

- `src/pages/api/csp-report.ts` (create)
- `tests/csp-report.test.ts` (create)

**Out of scope (do NOT modify)**

- `src/utils/request-security.ts` — the policy string stays exactly as-is in this plan.
- `public/_headers` — separate plan (002).
- Any other API route, middleware, or component.
- Do not add Redis-backed storage or a new dependency. Violation data goes to `console.warn`, which Cloudflare Workers observability already persists (`wrangler.jsonc` observability logs `persist: true`, `head_sampling_rate: 0.1`).

## Design constraints (non-negotiable)

1. **Always answer 204 and never throw.** Browsers ignore the response body, so a 4xx/5xx is pure noise; a malformed report is a hostile-input case, not an error. Every failure branch returns `new Response(null, { status: 204 })`.
2. **Never reject on missing `Origin`.** CSP reports are sent by the browser with no `Origin` header (or `Origin: null`). Calling `isAllowedFormOrigin` here would 403 every real report — that is the most likely way to break this feature. There is no CSRF concern: the endpoint is a write-nothing sink.
3. **Bound the input.** `readLimitedText(request, 8 * 1024)`; treat `null` as "drop".
4. **Do not log raw URLs or IPs.** Log only whitelisted, normalized fields. `document-uri`/`blocked-uri` are trimmed to scheme+host+path with the query string removed, and `blocked-uri` values that are not `http(s)`/`data` (for example `eval`, `inline`, `inline-speculation-rules`) are kept verbatim because they are the useful signal. Never read `cf-connecting-ip` here. This follows `docs/architecture/system-architecture.md:485` (no client IPs and no secrets in error reporting).
5. **Best-effort dedupe.** Keep a module-level `Map<string, number>` keyed by `effective-directive + '|' + origin + path`, capped at 200 entries; log a given key at most once per 10 minutes. Isolates are short-lived, so this only reduces floods; it does not need to be exact. Drop the oldest entry when the cap is hit.
6. **Both report formats.** Accept legacy `application/csp-report` (`{"csp-report": {...}}`), the Reporting API `application/reports+json` (an array of `{type, body}`), and anything else that parses to one of those shapes. Content type is a hint only; parse defensively.

## Steps

### 1. Create the route

Create `src/pages/api/csp-report.ts` with:

- `export const prerender = false;`
- `export const POST: APIRoute = async ({ request }) => {...}` returning 204 on every path.
- Export the normalizer as a named function (for example `export function normalizeReport(payload: unknown): ReportEntry | null`) so the unit test can target it directly. `ReportEntry` should be a small local type with the fields you actually log: `directive`, `blocked`, `document`, `disposition`, `sourceFile?`, `lineNumber?`.

Handling to implement, in order: read limited text → `JSON.parse` in `try` → normalize (single object or array; take at most 4 entries from an array; ignore the rest) → dedupe → `console.warn('[csp-report]', JSON.stringify(entry))` → return 204.

**Verify**: `bunx astro check` or `bun run check` exits 0 and the file is picked up (no export name errors).

### 2. Unit test the endpoint

Follow the existing pattern in `tests/request-security.test.ts` — it imports a route handler directly and calls it with a hand-built `Request` (see the `reactions` import near line 158). Those tests use `node:assert/strict` and `node:test` via `describe`/`it`, and run under `bun run test:unit`.

Create `tests/csp-report.test.ts` covering:

1. Legacy body with one entry → status 204.
2. `application/reports+json` array of two entries → 204, and `console.warn` called twice (stub `console.warn` and restore in the test).
3. Identical report twice in a row → 204 both times, `console.warn` called once (dedupe).
4. Oversized body (declare `content-length` above 8192, or send 9000 bytes) → 204, no log.
5. Malformed JSON → 204, no log.
6. Request with **no `Origin` header** → 204 with a log (regression guard against the `isAllowedFormOrigin` trap).
7. Query strings in `document-uri` are stripped from the logged entry.

**Verify**: `bun run test:unit` exits 0 and reports the new tests passing alongside the existing 300.

### 3. Smoke the route against the dev server

Start `bun run dev` in the background, wait for http://localhost:4321 to answer, then:

```
curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H 'content-type: application/csp-report' \
  --data '{"csp-report":{"effective-directive":"script-src","blocked-uri":"inline","document-uri":"https://piyushmehta.com/blog?ref=x","disposition":"report"}}' \
  http://localhost:4321/api/csp-report
```

Expected `204`, and the dev console shows one `[csp-report] {...}` line whose `document` is `https://piyushmehta.com/blog` (query removed). Stop the server afterwards.

## Test plan

- New file: `tests/csp-report.test.ts`, 7 cases above, `node:test` style, matching `tests/request-security.test.ts`.
- No E2E additions: the report-only header is already asserted indirectly by the release-artifact test; a browser cannot be forced to emit a violation cheaply.

## Done criteria

All must hold:

- `bun run check` exits 0.
- `bun run test:unit` exits 0 and includes the new `csp-report` cases.
- `curl` smoke above returns `204` and logs one sanitized line.
- `grep -rn "isAllowedFormOrigin" src/pages/api/csp-report.ts` returns nothing.
- `ls src/pages/api/csp-report.ts tests/csp-report.test.ts` both exist.
- No files outside the in-scope list are modified (`git status --short`).
- `docs/plans/README.md` execution status updated for plan 001.

## STOP conditions

Stop and report instead of improvising if:

- `bun run dev` cannot serve `/api/csp-report` (route not registered) — do not add `output: 'server'` or change `astro.config.mjs`; that means the routing assumption is wrong.
- The 204 responses work but no `[csp-report]` line appears in the dev console — do not add storage, reporting, or a new service; report the console behavior you observed.
- `readLimitedText` or `json` no longer exist with the described signature.
- A test needs a new dependency to run.

## Maintenance

- If the report-only policy is later promoted to the enforced policy (SEC-04 follow-up), this endpoint keeps working; browsers send to the same URL from `report-uri` and `Reporting-Endpoints`.
- If you add fields to the logged entry, update `tests/csp-report.test.ts` and keep the "no raw URL query, no IP" rule.
- Sampling: production logs are sampled at `head_sampling_rate: 0.1`, so counts are indicative, not exact. Do not build alerting on absolute numbers.
- Deliberately deferred: aggregation/dashboards and per-page violation history. Logs from Workers observability cover the need until SEC-04 is actually executed.
