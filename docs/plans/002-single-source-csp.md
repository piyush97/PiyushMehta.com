# 002 — One source of truth for the Content-Security-Policy

**Read this whole file before touching anything.** All context is inlined; the advisor who wrote it is unavailable. If reality does not match, stop and report (see STOP conditions).

**Drift check first**: `git diff --stat 0000186..HEAD -- src/utils/request-security.ts src/middleware/security.ts public/_headers tests` and `git status --short` — if those paths moved since this plan was written, re-read the current lines before editing. Note: `src/middleware/security.ts` and `src/utils/request-security.ts` were already dirty at planning time and those line numbers came from the working tree; trust the descriptions over the numbers.

## Status

- **Priority**: P1 (start only after plan 001 has landed its route)
- **Effort**: M (half a day, including one build + preview verification)
- **Risk**: MED — a CSP mistake silently breaks analytics, Turnstile, or the `/lab/embed/*` frames
- **Depends on**: `docs/plans/001-csp-report-endpoint.md` (the report sink is how you observe breakage)
- **Category**: security
- **Planned at**: `0000186`, 2026-11-12
- **Issue**: none

## Why

The site ships two different enforced CSPs. One is built in code and applied to HTML responses by middleware; the other is a static `_headers` file that Cloudflare Workers Assets applies to static files, including prerendered HTML. They have already drifted: the static file allows `'unsafe-eval'`, the code does not, and their host allowlists differ. Whatever a visitor actually receives therefore depends on whether the page happened to be prerendered or server-rendered — which is not a property anyone should have to reason about when tightening security.

`docs/plans/hardening-and-optimization.md` (SEC-04) wants to drop `'unsafe-inline'`/`'unsafe-eval'` and unused hosts. That work is unsafe to start while two policies can disagree: you can tighten one and believe you are done.

Goal: one canonical policy definition, a static copy that provably matches it, and `'unsafe-eval'` removed after evidence that nothing needs it.

## Current state

- `src/utils/request-security.ts:5` — `const CSP = "..."`: the canonical enforced policy used by SSR HTML.
- `src/utils/request-security.ts:7` — `securityHeaders(hashes)`; line 9 sets `Content-Security-Policy` from `CSP`; line 10 builds a separate strict `Content-Security-Policy-Report-Only` from inline-script hashes; line 11 sets `Reporting-Endpoints: csp="/api/csp-report"`.
- `src/utils/request-security.ts:21` — `export const SECURITY_HEADERS = securityHeaders();`
- `src/middleware/security.ts:24-28` — only injects headers when the response is HTML and does not already carry a report-only header; otherwise applies `SECURITY_HEADERS` without overriding existing keys.
- `src/middleware/security.ts:30-35` — for `/lab/embed/*` it deletes `X-Frame-Options` and rewrites `frame-ancestors 'none'` to an allowlist.
- `public/_headers:2` — site-wide enforced CSP for static assets (contains `'unsafe-eval'`).
- `public/_headers:43-46` — `/lab/embed/*` block: adds a second enforced CSP with a different `frame-ancestors`.
- `wrangler.jsonc` + generated `dist/server/wrangler.json` — assets directory is `../client` (`dist/client`), `html_handling: "drop-trailing-slash"`. So `public/_headers` is copied to `dist/client/_headers` and applies to prerendered HTML too.
- `docs/plans/hardening-and-optimization.md:65` — SEC-04 is the motivating item; do not treat its proposed host list as decided, verify usage yourself.

The two policy strings were partially unreadable when this plan was written, so **do not trust any summary of their differences — including this one.** Derive the diff yourself in step 1.

## Environment

| Purpose              | Command                                                                                   | Expected                        |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------- |
| Typecheck/lint       | `bun run check`                                                                           | exit 0                          |
| Unit tests           | `bun run test:unit`                                                                       | exit 0                          |
| Build                | `bun run build`                                                                           | exit 0, writes `dist/`          |
| Preview built worker | `bun run preview`                                                                         | serves on http://localhost:8787 |
| Release gate         | `bun run check:release`                                                                   | exit 0                          |
| Chromium smoke       | `bunx playwright test tests/portfolio-smoke.spec.ts tests/lab.spec.ts --project=chromium` | see step 5                      |

## Scope

**In scope**

- `src/utils/request-security.ts` (extract/share the policy string; no behavior change beyond alignment)
- `public/_headers` (align the `/*` and `/lab/embed/*` CSP lines)
- `tests/csp-policy.test.ts` (create, drift guard)
- `docs/plans/README.md` (status update)

**Out of scope (do NOT touch)**

- `src/middleware/security.ts` logic (frame-ancestors rewriting, report-only hashing) — this plan aligns policy text, not middleware flow.
- `public/_redirects`, `wrangler.jsonc`, `astro.config.mjs`.
- Removing `'unsafe-inline'` from `script-src`, or moving inline scripts to hashes. That is the SEC-04 follow-up and needs plan 001's data first.
- Adding CSP hosts for services the site does not use (Giscus, new analytics). Not part of this change.
- Do not introduce a build-time `_headers` generator in this plan. Generation is explicitly deferred (see Maintenance); a parity test is the guard for now.

## Steps

### 1. Establish what production actually serves, and diff the two policies

Run `bun run build`, then `bun run preview` in the background. Fetch headers for one prerendered page and one server-rendered route:

```
curl -sI http://localhost:8787/about | grep -i '^content-security-policy'
curl -sI http://localhost:8787/lab/embed/ | grep -i '^content-security-policy'
curl -sI http://localhost:8787/api/chat/config | grep -i '^content-security-policy'
```

Record for each: how many `Content-Security-Policy` headers came back, and whether the value came from `_headers` (contains `'unsafe-eval'`) or from code (does not).

Then diff directive by directive. Use a throwaway command, not a new committed script:

```
node -e '
const fs=require("fs");
const h=fs.readFileSync("public/_headers","utf8").match(/^  Content-Security-Policy: (.*)$/m)[1];
const src=fs.readFileSync("src/utils/request-security.ts","utf8");
const c=src.match(/const CSP = "(.*)";/)[1];
const split=s=>Object.fromEntries(s.split(";").map(x=>x.trim()).filter(Boolean).map(d=>{const [k,...v]=d.split(/\s+/);return [k,new Set(v)]}));
const A=split(h),B=split(c);
for(const k of new Set([...Object.keys(A),...Object.keys(B)])){
  const a=[...(A[k]||[])].sort(),b=[...(B[k]||[])].sort();
  if(JSON.stringify(a)!==JSON.stringify(b)) console.log(k,"\n  headers :",a.join(" "),"\n  code    :",b.join(" "));
}'
```

Write the observed facts into a comment at the top of `tests/csp-policy.test.ts` when you create it (one short line: which surface serves which header). Stop the preview server afterwards.

**Verify**: you have a printed directive diff and a note of which policy governs prerendered HTML.

### 2. Align `public/_headers` with the canonical policy

Decide the canonical value per directive. Default rule: the **code** policy wins for `/*`, because it is the one guarded by the report-only experiment and the middleware path; add any header-only source to it **only if you can point to real usage** (a `grep` hit in `src/`, or a third-party script the page actually loads). If something in `_headers` is stricter than code (for example `img-src` without `https:`), do not silently loosen or tighten it — pick one value, state the reason in a code comment, and mirror it in both places.

Then edit `public/_headers:2` so that, apart from `unsafe-eval` (removed in step 3), its directive set equals the code policy exactly. Do the same for the `/lab/embed/*` block at `public/_headers:43-46`, keeping `frame-ancestors` as the embed allowlist (the middleware rewrites that directory's `frame-ancestors`; the static file must express the same list).

Also add the reporting headers to `_headers` so prerendered pages report too:

```
  Reporting-Endpoints: csp="/api/csp-report"
  Content-Security-Policy-Report-Only: <same strict policy as request-security.ts:10, minus the inline-script hashes>
```

For the report-only line, keep `script-src 'self'` and do **not** add `'unsafe-inline'`: inline-script violations are exactly the data the SEC-04 follow-up wants. Deduplication in `/api/csp-report` (plan 001) keeps the log volume bounded.

**Verify**: re-run the diff command from step 1, substituting the report-only value, and confirm the enforced directives are identical between the two files. Show the command output in your report.

### 3. Remove `'unsafe-eval'` — only with evidence

Before removing it, look for a real consumer:

```
grep -rn "eval(\|new Function(" src public/lab 2>/dev/null | grep -v "\.map"
grep -rl "eval(" dist/client/_astro | head
```

- If any hit is application code, **stop** and report it; removing `'unsafe-eval'` would break it and the fix belongs to a different plan.
- If the only plausible consumer is a third-party tag, keep `'unsafe-eval'` in the `script-src` of both policies and say so in Maintenance — do not gamble on analytics.

If nothing needs it, delete `'unsafe-eval'` from both `public/_headers` CSP lines and from `src/utils/request-security.ts` if present.

**Verify**: after `bun run build && bun run preview`, `curl -sI http://localhost:8787/about | grep -i '^content-security-policy'` shows no `unsafe-eval`.

### 4. Add the drift guard test

Create `tests/csp-policy.test.ts` using `node:test` + `node:assert/strict` (same style as `tests/request-security.test.ts`):

1. Read `public/_headers` with `node:fs`; extract the CSP value for the `/*` block.
2. Import `securityHeaders` from `../src/utils/request-security` and read its `'Content-Security-Policy'`.
3. Normalize both (split on `;`, trim, split directive/sources, sort sources, sort directives) and `assert.deepEqual`.
4. Same check for the `/lab/embed/*` CSP, where the static `frame-ancestors` list must equal the sites the middleware rewrites to (`src/middleware/security.ts:31-35`). If the two lists are not expressible identically, assert the _set_ of every other directive matches and assert the `frame-ancestors` list explicitly.
5. `assert.ok(!/unsafe-eval/.test(enforced))` — one line that prevents silent reintroduction, unless step 3 concluded a consumer needs it.

**Verify**: `bun run test:unit` exits 0; the new test fails if you revert either file (try it once by hand, then restore).

### 5. Prove nothing broke

- `bun run check:release` exits 0.
- Build + preview, then click-through smoke of `/`, `/blog`, `/ask`, `/contact-me`, `/lab/`, one `/lab/embed/*` demo: no CSP violations in the browser console beyond what you can explain, Turnstile widget renders on `/contact-me` and `/ask`, and the embed demo frames correctly.
- `bunx playwright test tests/lab.spec.ts --project=chromium` passes (it asserts the embed frame contract).

## Test plan

- New: `tests/csp-policy.test.ts` (directive parity + no `unsafe-eval`). Five assertions, `node:test`.
- Existing must stay green: `bun run test:unit` (300 tests) and `tests/release-artifacts.test.ts`, which asserts the built `_headers` content — if it hard-codes a CSP string it must be updated in the same commit. Read it before editing.

## Done criteria

- `bun run check` exits 0.
- `bun run test:unit` exits 0, including the new parity test.
- The step 1 diff command, re-run on enforced policies, prints nothing.
- `grep -c "unsafe-eval" public/_headers` is `0`, or the removal was abandoned with a documented reason in the plan's status line.
- `bun run check:release` exits 0.
- No files outside scope modified.

## STOP conditions

Stop and report if:

- Prerendered pages return **two** `Content-Security-Policy` headers in production-like preview and neither is yours — that means Workers Assets and middleware both apply and need a different strategy than aligning strings.
- Aligning the policies requires a source neither file already contains (a new host), and you cannot find a code reference that needs it.
- A directive difference exists that you cannot express identically in both files.
- Removing `unsafe-eval` breaks the Turnstile widget or the embed demos in step 5, and adding it back does not fix it within one retry.

## Maintenance

- The parity test is the guard. Any future CSP edit must land in both files in one commit; the test enforces it, so do not "fix" the test instead of the policy.
- Explicitly deferred: generating `dist/client/_headers` from the code constant at build time, which would remove the duplication entirely. It needs a shared non-TS data file (JSON) imported by both `request-security.ts` and a build script; a follow-up plan should do that once SEC-04's inline-script work lands, because only then will the report-only policy be expressible without per-page hashes.
- Removing `'unsafe-inline'` from `script-src` is SEC-04's job, not this plan's.
