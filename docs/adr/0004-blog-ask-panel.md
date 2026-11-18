---
id: adr-blog-ask-panel
type: module-design
title: Post-scoped "Ask this note" panel
status: draft
parent: architecture
references: [adr-chat, adr-public-content]
---

# ADR-0004: "Ask this note", a post-scoped scope on the existing assistant

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision owners:** Piyush Mehta
- **Design:** [docs/plans/blog-ask-panel.md](../plans/blog-ask-panel.md)
- **Amends:** ADR-0001 item 6 (Upstash scope). Extends ADR-0003; nothing in ADR-0003 is reversed.

## Context

`/ask` answers about Piyush from a flat BM25 index over the whole site. That index drops fenced code and section boundaries, so a reader inside a long note cannot ask "what did this section argue?" without leaving the page, and the answer treats the note as one document among 56. Notes are long and half technical, so grounding on prose that was stripped of its code is weak.

## Decision

1. **Post scope is a second routing mode on the one assistant**, not a second assistant. One pipeline (`runChat` and `runPostChat` share `streamAnswer`), one guard, one classifier, one session model, one trace shape. `ChatTrace['scope']` gains `'post'`.
2. **Context is the whole note, section by section, with its code**, from a second build artifact `src/data/post-sections.json` (`scripts/build-post-sections.mjs`). Sections follow the article's own table-of-contents rule (depth 2 and 3). A note with no such headings gets one synthetic section so no published note can be missing. Question mode appends at most two BM25 hits from other pages (never the note's own chunks) and the facts chunk, and the prompt requires the answer to say when it leaves the note. Summary mode uses the note alone, so a cached summary never depends on a query.
3. **Site scope is untouched.** `chat-index.json`, the BM25 corpus, `topicGate`, the site prompts, `REFUSAL` and `/api/chat` keep their behaviour. The cost is storing note prose twice (flat and structured). Re-chunking the flat corpus by section would remove that, but it would change site-scope retrieval and invalidate the recorded eval baseline. The duplication is the cheaper risk, and the release check carries a gzipped-bundle ceiling so the cost stays visible.
4. **One classifier, unchanged criteria, two input shapes.** The Clef criteria, the 0.6 threshold and the fail-closed behaviour are not modified. `classifyScope` takes an optional `state` that replaces the default input; post scope passes one that names the note and its headings, so a bare "why?" has a referent. Every post question goes through the classifier, including greetings.
5. **Summary skips the classifier but not the gates.** The server picked the note, so a summary is not a user request. It still requires the session token, per-IP limits and a global generation cap.
6. **Redis holds one more kind of operational state: a TTL'd memoized summary.** Key `chat:summary:v2:<slug>:<digest>`, 30-day TTL, where `digest` is a build-time SHA-256 prefix of the note's structured content, so editing a note changes the key and a stale summary cannot be served. The version in the key invalidates all summaries when the prompt changes. A cached value is re-checked by the output guard before replay. **Redis is not becoming a content store:** note text stays in the build artifact, the cache holds a derived string, and nothing about a reader is written. If Redis is unavailable the summary path returns 503 and calls no model.
7. **The Turnstile site key is read at runtime** from `GET /api/chat/config`. `PUBLIC_TURNSTILE_SITE_KEY` is `@dynamic`; varlock throws when a dynamic public value is read during prerender, and article pages are prerendered, so the key cannot be inlined. A site key is public by design; the secret never leaves the Worker. The panel keeps its session in `sessionStorage` (short-lived, dies with the tab) so moving between notes reuses one session.
8. **The client is a small vanilla module script, not an island.** It parses the same UI-message stream and renders a constrained subset (paragraphs, bullets, bold, inline code, links) with DOM nodes only. A link is created only when `isAllowedUrl` passes, re-checking what the server guard enforced. Only article pages carry it. It imports `ChatTrace` with `import type` so the AI SDK stays out of the browser bundle.
9. **The article reserves the panel's space instead of being overlaid.** A 400px right-anchored panel overlapped the prose at every viewport from 768px up in the design's measurements, so on wide viewports the article wrapper gains right padding while the panel is open and the prose reflows left. Below 1280px there is no room (the table-of-contents rail plus a 400px panel leaves a prose column too narrow to read), so the panel is an 85dvh bottom sheet over the page. The design named 1024px; 1280px is the implemented threshold.
10. **The budget is counted in neurons**, the unit Workers AI meters, not requests. The caps below were derived from the design's estimates (about 8 neurons per site question, 9 to 13 per post question, 6 to 8 per post summary against a 10,000 neuron/day allowance). Those estimates are not re-measured here; the live eval must measure real consumption before any cap is raised.

| Bucket                    | Limit                                   |
| ------------------------- | --------------------------------------- |
| Post ask, per IP          | 4/min, 20/day                           |
| Post summary, per IP      | 4/min, 60/day (counts hits)             |
| Post ask, global          | 100/day                                 |
| Post summary, global      | 60/day, cache misses only               |
| Site `/api/chat` (as was) | 8/min and 60/day per IP, 600/day global |

Post scope has its own Redis buckets, so it cannot spend the site-scope budget.

## Consequences

- A cached summary costs one Redis read and no model call. A cold fill is one generation per note.
- The post-sections artifact adds roughly 0.22MB gzipped to the Worker bundle (measured on the generated JSON alone). The design's 194KB figure was a bundle measurement and was not repeated here. `scripts/verify-release.mjs` fails the release when the gzipped server bundle exceeds 2.5MB.
- `scripts/build.mjs` fails when the committed `post-sections.json` is not byte-identical to what the MDX produces.
- Notes that embed MDX components lose that rendered content in the context, because source text cannot reveal it. Prose, headings and code are preserved.
- A reader cannot ask about a note that is not published; the slug only selects from the server's own artifacts.

## Not done yet

- Real neuron consumption has not been measured. `bun run eval:live` (post-scope cases added) must pass, and consumption must be read from the Cloudflare dashboard, before any cap is raised.
- No per-note quality review of the generated summaries.
