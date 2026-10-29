---
id: routes
type: module-design
status: draft
title: Public routes and APIs
parent: architecture
depends-on: [content]
references: [adr-chat, adr-public-content]
---

## Responsibility

Astro routes assemble public pages, feeds, discovery assets, and runtime endpoints for contact, reactions, and Ask Piyush.

## Boundary

Public article routes exclude drafts. Runtime handlers validate requests and use shared utilities for service access; contact and chat fail closed when required safeguards are unavailable. Chat's scope and security contract lives in `adr-chat`. _(Boundary inferred from implementation; unconfirmed.)_

## Conversion counts

Four anonymous daily totals answer "is the site producing inquiries?" without a third-party tracker: `contact_sent`, `chat_question`, `resume_download`, `reading_path_click`. Each is one Redis counter per event per UTC day with a 60-day expiry, allowed by `adr-public-content` item 6. No IP, path, referrer, or user agent is stored.

- The server counts contact and chat after the action succeeds (Resend accepted; question passed every limit), so the browser can't forge them. The browser reports résumé and reading-path clicks to `/api/conversions`, which accepts only those two events, checks origin, rate-limits each IP, and fails closed with 503 without a limiter. Those two counts can still be inflated up to the rate limit.
- Counting is best effort, runs after the response, and never fails the action it counts. Writes use the no-retry client so an INCR with an unknown result is never repeated; an undercount is acceptable, an overcount isn't.
- `/stats` shows the last 28 days next to the 28 before, matching the growth plan's comparison. It is protected by HTTP Basic against `STATS_PASSWORD`, returns 503 when that is unset, is never cached or indexed, and reports a store failure as unavailable instead of zeros. It reads `STATS_PASSWORD` from Varlock's `ENV` and falls back to the Worker binding, because `ENV` only holds keys baked into the build-time `__VARLOCK_ENV` blob and throws for any other key. Without the fallback, a secret added later with `wrangler secret put` caused a 500.
