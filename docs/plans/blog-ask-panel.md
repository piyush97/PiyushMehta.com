# Design: "Ask this note", a post-scoped assistant inside rendered articles

Status: DRAFT, waiting for approval · Owner: Piyush Mehta · Date: 2026-10-20
Extends: ADR-0003 (Ask Piyush chatbot), ADR-0001 (build-time content, no database)

---

## 1. Intent and the why

A reader lands on a 2,500-word field note about a production incident. They want to know
what the author actually claimed, whether the evidence supports it, and what else he has
written about the same problem — without leaving the page and without losing their place.

Today the only Ask surface is `/ask`, a separate full-page assistant that answers about
Piyush in general. Reaching it means leaving the article, and once there the assistant
retrieves across the whole site, so "what did this note actually argue?" is answered the
same way as "what is his stack?" — the note is just one document among 51.

This feature puts a **post-scoped** assistant inside the article: grounded first on the note
the reader is reading, falling back to his other writing only when the question is broader
than the note. It is the same pipeline, the same guard, the same classifier, the same
models, and the same fail-closed posture as `/ask` — a second scope on one assistant, not a
second assistant.

**Why now.** The retrieval index already carries every published post (`src/data/chat-index.json`,
362 chunks across 51 posts). Post scope needs no new model, no new dependency, and no
change to the audited `/ask` path. It is a routing change plus a surface.

**Non-goals.**

- Not a second chat product. One pipeline, one prompt family, one guard, one classifier, one
  session model, one trace shape.
- Not a page-level rewrite of the article. The panel is additive; the article remains
  readable, complete, and correct with JavaScript disabled.
- Not a memory system. Each question is answered on its own (ADR-0003 rule 5). The note
  itself is the context, so follow-ups work without conversation history.
- Not a per-post copy of the content in a database. The build artifact stays the source.

**Anti-goals (what failure looks like).**

- A floating widget that covers the prose or competes with the reading spine.
- A panel that spends model quota on page load, or that a reader cannot escape.
- A second surface that can drift from `/ask` in prompt, guard, or scope rules.
- A summary that is hollow because the code was stripped out of it.

---

## 2. The design in one page

**Surface.** A quiet floating trigger, bottom-right, on rendered article pages only. It
opens a panel that is **anchored to the bottom-right of the viewport, overlapping the page's
right margin rather than the prose column** (§5, D12). The panel is a non-modal region,
not a modal: the article stays scrollable and readable behind it. Esc closes it; focus
returns to the trigger.

**Two actions, two cost profiles.**

| Action | Model calls | Cost | Gate |
|---|---|---|---|
| Open the panel → **Summary** | 1, and only on a cache miss | one generation per note per cache window, then free | session, per-IP limits, global generation cap |
| Reader types a question → **Answer** | 2 (scope check + answer) | one reader action | session, per-IP limits, global question cap |

**The summary cache is what makes the feature affordable.** A note's summary is a function
of (note content, prompt version) and nothing else — no reader input, no query. So it is
computed once and served to every reader from Redis for 30 days. With 51 published notes
that is **≈1.7 generations per day in steady state**, no matter how much traffic a note
gets. The global cap of 60/day exists to bound the cold fill, not the steady state.

**Grounding.** Post scope = **every section of the note, in order, with its code**, plus
up to 2 chunks from other posts matched by BM25 as fallback, plus the canonical facts
chunk. The system prompt says the note is primary, that other pages may be used only when
the note does not cover the question, and that using them must be said out loud. Sources
are linked, so a reader can see which page backed which claim.

**Follow-ups work without history.** Because the whole note is in context, "why did he pick
that?" is answerable even though the server never receives prior turns. This is the single
biggest reason to use full-note context over BM25 top-k.

**The summary is server-composed.** The client never sends summary text. The server owns
the prompt, the scope, the cache key, and the guard. The client asks for `mode: "summary"`
and renders what comes back.

---

## 3. Decisions and their reasons

These are the builder's instructions, not a menu.

**D1 — Post scope retrieves the whole note, section by section.**
The published notes are long and half technical: 700 section headings and 215 fenced code
blocks across 51 notes, and the flat index drops all code (14.8% of raw body characters) and
all section boundaries. A summary written from that is a summary of prose *about* code, and
it cannot say "the section on the queue" because no section exists in the corpus.

So the build emits a second, structured artifact: `src/data/post-sections.json`, one entry
per published note, each an ordered list of sections. Each section is
`{ level, heading, text, code[] }` where `text` is prose with markdown syntax flattened
and `code[]` holds the fenced blocks that appeared inside it, verbatim. A note with no
headings gets one synthetic section with `level: 0, heading: null` holding the whole body,
so **every published note has at least one section** and no note can be missing from the
corpus. 169 sections carry code.

Section splitting follows the article's own TOC rule — depth 2 and 3 — so the panel's
section list and the page's table of contents agree.

**D2 — Site scope is provably untouched.**
The flat index, the BM25 corpus, the scope gate, the prompts, and the `/api/chat`
endpoint keep their current behaviour exactly. The new artifact is additive. The
consequence is that the note's prose is stored twice — once flat for site scope, once
structured for post scope. Measured, that costs **194KB gzipped** in the Worker bundle
(against 173KB gzipped for the existing flat index) and is the price of not re-running the
ADR-0003 evals against a changed retrieval corpus. The alternative (re-chunk the flat
corpus by section) removes the duplication but changes site-scope retrieval results and
invalidates the recorded eval baseline. The duplication is the cheaper risk, and the build
gains a bundle-size gate (§6) so the cost stays visible.

**D3 — One classifier, unchanged criteria, two input shapes.**
The scope criteria in `src/utils/chat/models.ts` already include "writing, views
expressed in his articles", so a question like "what does this note argue?" is already in
scope for `/ask` today. Nothing needs to widen, and nothing is narrowed: **the criteria
payload is not modified at all.**

What changes is only the *input*. Site scope passes `classifierInput(question, pageTitles)`
as it does today. Post scope passes a different state that names the note the reader is on
and its headings, so the classifier can tell that a bare "why?" refers to that note. Same
system prompt, same Clef criteria, same 0.6 confidence threshold, same fail-closed
behaviour, same text fallback — one classifier, one payload, two input shapes.

The scope dataset is therefore unchanged, and `/ask`'s recorded eval baseline stays valid.

**D4 — The panel speaks the same wire format, in a small client.**
`/api/chat` already streams an AI SDK UI message stream (`text-start` / `text-delta` /
`text-end` / `data-trace` / `source-url`). The panel parses that same stream in roughly
40 lines of plain TypeScript, following the parsing pattern already proven in
`scripts/chat-live-eval.ts`. It does not import the AI SDK client, React, or
react-markdown, and it is not an Astro island — it is a bundled module script that
re-initialises on `astro:page-load`.

The client imports the `ChatTrace` **type** with `import type` only. A value import would
pull `src/utils/chat/pipeline.ts` — and therefore the AI SDK — into the browser bundle.

**D5 — Plain-prose answers, with a deliberately small renderer.**
The post-mode system prompt constrains the model to plain paragraphs, `- ` bullets,
`**bold**`, `` `code` ``, and `[text](url)` links. The client renders exactly that subset
and builds DOM nodes only — never `innerHTML` — so there is no HTML injection surface. A
link is only created when the URL passes the existing `isAllowedUrl` allowlist
(`src/utils/chat/guard.ts`, already a pure function with no server imports, and already
imported client-side by `useAskPiyush.ts`), so the client re-checks what the server's
guard already enforced. The `/ask` page keeps react-markdown; a 400px panel does not need
a 300KB dependency.

**D6 — Vanilla client, loaded only where it is used.**
The panel ships as an Astro component with a bundled module script, mounted only in
`src/pages/blog/[slug].astro`. Article pages carry the code; no other page carries any of
it. No React, no hydration, no island.

**D7 — The Turnstile site key is fetched at runtime, and it must be.**
`PUBLIC_TURNSTILE_SITE_KEY` is `@dynamic` in `.env.schema`, and varlock's build-time guard
*throws* if a dynamic public value is read during prerender. The blog route is
`prerender = true`, so it cannot inline the key — the panel would fail the build if it
tried. The key is therefore read at runtime from a new public endpoint,
`GET /api/chat/config`, and cached in memory for the page. A Turnstile *site* key is
public by design — it is rendered into the page for every visitor — so exposing it via a
cached GET is safe. The *secret* key is never exposed and never leaves the Worker.

**D8 — Both modes require a session; only the summary skips the classifier.**
The classifier exists to judge *user* requests, and ADR-0003 requires scope to be enforced
before the model. A summary of a note the server itself selected is not a user request, so
it skips the classifier: 1 model call instead of 2. But it is still a public model call, so
it still requires the session token, the per-IP limits, and the global generation cap —
otherwise a bot could burn the site's free quota by opening panels.

The session handshake is unchanged: `POST /api/chat/session` with a Turnstile token, which
returns an IP-bound HMAC token valid for 30 minutes. The panel obtains it lazily, on
first open, and **caches it in `sessionStorage`** so that navigating between articles
reuses one session instead of minting a new one per page — `sessionStorage` rather than
`localStorage` because it is a short-lived credential that should die with the tab. The
existing `ratelimit:chat-session` cap of 20/hour/IP then allows roughly two sessions per
hour of browsing, comfortably inside the limit.

**D9 — The quota budget, counted in neurons.**
Workers AI's free allowance is **10,000 neurons/day**, and neurons are what actually meter
spend. Published per-model rates: `granite-4.0-h-micro` is 1542 neurons per M input
tokens and 10158 per M output tokens; `clef-flash` is 3455 per M input tokens and is not
charged for output. The current caps were set against request counts, which is the wrong
unit, so the budget is restated here in neurons and the caps are re-derived from it.

A site-scope question costs roughly 8 neurons (about 1,900 input tokens and 200 output
tokens through granite, plus a small clef call). A post-scope question costs roughly 9–13,
because the whole-note context is larger than the site context; a post summary about 6–8.
Against the current 600 questions/day, that is ≈4,800 neurons/day.

| Surface | Limit | Neurons/day |
|---|---|---|
| Site scope, existing | 600 questions/day | ≈ 4,800 |
| Post scope, questions (new) | 100 questions/day | ≈ 900–1,300 |
| Post scope, summary generations (new) | 60 generations/day, cache misses only | ≈ 400 |
| | **ceiling** | **≈ 6,100–6,500 of 10,000** |

Steady state is far below the ceiling: summaries cost ≈1.7 generations/day ≈ 13 neurons, so
the realistic total is ≈4,850 neurons/day, essentially unchanged. The one-time cost of
cold-filling all 51 summaries is ≈410 neurons, about 4% of a day's allowance.

These are the numbers to change if the free tier turns out to be the binding constraint,
and the post caps are the knob that turns without touching site scope. The live eval must
measure real consumption before any of them are raised.

Per-IP limits for the new surface are tighter than `/ask`'s, because the panel is the more
discoverable one and a reader can reach it on 51 pages: questions 4/min and 20/day;
summary requests 4/min and 20/day.

**D10 — Summary caching keys on a build-time content digest.**
`scripts/build-post-sections.mjs` computes a SHA-256 over the note's structured content and
stores the first 16 hex characters with the note. The Redis key is
`chat:summary:v2:<slug>:<digest>`. Editing a note changes its digest and therefore its
key, so a stale summary can never be served; the prompt version in the key invalidates
every summary when the prompt changes. The digest is computed at build time, so
invalidation needs no runtime hashing and no second artifact to keep in sync.

**D11 — Summary mode has no site fallback; question mode does.**
A summary is of *this note*. Pulling other notes' content into it would make it a summary
of the wrong thing, and it would make the cached value depend on a query that does not
exist in summary mode. So summary context is the note and nothing else, its single source
is the note itself, and the cached value is self-contained.

Question mode uses the reader's question as the BM25 query, over the index excluding the
note's own chunks, top 2 hits, plus the facts chunk, appended after the note.

**D12 — The panel anchors to the viewport's right margin, and the article reserves that
margin.**
A viewport-right-anchored panel *does* overlap the prose at every realistic width. Measured
on the built site against `.blog-post-content` (`dist/client`, Chromium):

| viewport | prose column | 400px right-anchored panel | overlap |
|---|---|---|---|
| 768 | 31 → 737 | 368 → 768 | 337px (48%) |
| 1280 | 294 → 1232 | 880 → 1280 | 352px (37%) |
| 1440 | 371 → 1320 | 1040 → 1440 | 280px (30%) |
| 1920 | 616 → 1560 | 1520 → 1920 | 40px (4%) |

The article shell is `min(100%, 1200px)` and the prose fills its column, so the viewport's
right margin is only ≈48px at 1280. An overlay cannot avoid the prose. Therefore the
article **reserves the space instead**: when the panel opens, the article shell gains a
right margin of 400px + a gap, and the panel takes that space. The prose reflows to the
left of the panel; nothing is ever covered. Below 1024px there is no room to reserve, so
the panel is a bottom sheet at 85dvh that overlays the page, and the reader can still
scroll the article above it.

This means the panel is a *layout participant*, not an overlay, on desktop. That is a real
constraint and it is the price of not covering the prose.

---

## 4. Non-negotiables mapped to design

| Requirement | How it is met |
|---|---|
| The article stays readable with JS off | The panel is additive. The existing `AskLink` doorway to `/ask?q=…` stays in the closing ledger and is the no-JS path. The trigger is a real link to `/ask?q=…` that JS upgrades. |
| Every answer is grounded and cited | Post scope puts the whole note in context; sources are emitted as `source-url` parts and rendered as links. |
| Scope is enforced before the model | Same classifier, same criteria, same threshold, same fail-closed path (D3). A refusal costs no answer call. |
| Output cannot leak or mislead | Same `createStreamGuard` — canary, prompt-leak phrases, URL allowlist, no HTML, no images — on both the summary and the answer path. |
| Free models only | Same `chatModels()` chain: Workers AI primary, Groq fallback, polite unavailable state. |
| No database | Redis holds rate-limit counters and a TTL'd memoized summary. No schema, no migrations, no durable content. The published-post manifest is the only allowlist. |
| Fail closed | Missing session secret, Turnstile secret, rate limiter, or Redis ⇒ 503 for the affected path. The article itself is unaffected. |
| No reader text is stored | Nothing about a reader is written anywhere. The summary cache holds a per-note string keyed by content digest, not by reader. |
| Theme, keyboard, reduced motion, contrast | Trigger and panel use the existing Evidence Ledger tokens; 44px trigger target; visible 2px accent focus ring; one authored slide/fade motion, disabled under `prefers-reduced-motion`; text tokens keep ≥4.5:1. |

---

## 5. What the reader sees

**Collapsed.** A 44px, hairline-bordered, tonal-surface control at the bottom-right of
article pages, with an authored SVG spark glyph and the label "Ask". Amber appears on
hover, focus, and open state only. It is not filled, does not glow, and does not use a
Unicode glyph. It must never overlap the desktop TOC rail (which is on the left) or the
top reading-progress bar.

**Open, desktop (≥1024px).** A 400px panel in the space the article reserves for it
(D12): the article shell gains a right margin and the prose reflows left, so the panel
never covers a word. Hairline border, `--color-surface-raised`, radius 12px, and the
elevation shadow already in the vocabulary (`0 16px 40px rgba(0,0,0,0.18)`).

**Open, mobile (<1024px).** The same content as a bottom sheet at 85dvh, with a header
holding the note title and a close button. The article scrolls above it.

**Contents**, top to bottom:

1. Note title (Muli, 800) and the note's own description — the static orientation, free
   and instant, rendered before anything else.
2. "In brief" — the cached or live summary, streamed. The static orientation is already on
   screen while it arrives. States: preparing, ready, unavailable (one honest line, no
   error theatre).
3. "Sections" — the note's section headings, each a button that asks about that section.
   Zero quota to render, and it gives the reader a way in without typing. The article's own
   table of contents is labelled "On this page"; the panel's list is labelled "Sections" so
   the two never read as the same thing on one screen.
4. The answer region. The reader's question, then the streamed answer, then source chips
   ("This note", "Related: <page title>"), then a compact trace line: scope, provider,
   guard. Nothing is shown that the server did not report.
5. The composer. Placeholder names the note. Enter sends, Shift+Enter breaks the line.
   A "Ask Piyush instead" link to `/ask` sits at the bottom of the panel for readers who
   want the full-page assistant.

**Copy.** "Ask this note" is the trigger. "In brief" is the summary label. "Sections"
lists the sections. The composer's placeholder is "Ask about this note…". Error copy names
the problem and the recovery, in the voice of the existing `/ask` errors: rate limited
("Too many questions in a short time…"), session expired ("Your session expired. Send the
message again."), model unavailable ("The assistant is offline right now. The full note is
still above.").

---

## 6. Implementation surface

**New files:**

- `src/pages/api/chat/config.ts` — `GET`, `prerender = false`. Returns
  `{ siteKey: string | null }`. Public value, `Cache-Control: public, max-age=300`.
  503 when the chat subsystem is not configured.
- `src/pages/api/chat/post.ts` — `POST`, `prerender = false`. The post-scoped endpoint
  (details in §7).
- `src/data/post-sections.json` — the structured note corpus (build artifact, committed
  like `src/data/chat-index.json`).
- `scripts/build-post-sections.mjs` — emits it from published MDX, with the content digest.
- `src/utils/chat/post-context.ts` — pure. Resolves a slug to the note's structured
  sections, the content digest, the site-fallback chunks, and the context blocks.
- `src/utils/chat/summary-cache.ts` — Redis get/set for memoized summaries. Fails closed
  when Redis is unavailable.
- `src/utils/chat/answer-text.ts` — pure. Parses the constrained answer subset into
  blocks. Unit-testable with no DOM.
- `src/components/chat/PostAskPanel.astro` — the trigger, the panel shell, the static
  orientation, the section buttons, the styles, and the client script.
- `tests/chat-post-context.test.ts`, `tests/chat-answer-text.test.ts`,
  `tests/post-ask.spec.ts`.

**Modified files:**

- `scripts/build.mjs`, `package.json` (`dev`, `start`, `build:post-sections`) — run the new
  build step.
- `src/utils/chat/schema.ts` — add `postChatRequestSchema`:
  `{ post: string (≤120), mode: 'ask' | 'summary', question?: string (≤500) }`.
- `src/utils/chat/prompt.ts` — add `postAskSystemPrompt`, `postSummarySystemPrompt`,
  `postContextBlock`, `postClassifierInput`, and `POST_REFUSAL` (a post-scoped refusal
  that names the note, since the site-scope `REFUSAL` tells a reader to ask about
  RoastTube). The existing site prompts are untouched.
- `src/utils/chat/models.ts` — add the post-scope classifier input shape. The criteria
  payload, threshold, and fail-closed behaviour are unchanged (D3).
- `src/utils/chat/pipeline.ts` — `runChat` gains a scope so post scope can select its own
  context, prompt, refusal text, and trace label. Site scope must behave byte-for-byte as
  today.
- `src/utils/chat/guard.ts` — unchanged. `isAllowedUrl` is reused by the client renderer.
- `src/components/chat/AskPiyush.tsx` and `src/components/chat/useAskPiyush.ts` — the
  shared `ChatTrace['scope']` union gains `'post'`, so the `SCOPE_LABEL` map and the
  localStorage trace schema need the new member. No behaviour change.
- `src/pages/blog/[slug].astro` — mount the panel; pass slug, title, description, reading
  time, section count, and heading texts. Also apply the reserved-right-margin class when
  the panel opens (D12).
- `tests/chat-pipeline.test.ts` — extended with the post-scope cases in §8.
- `tests/chat-evals.test.ts` — extended with the deterministic post-scope assertions in §8.
  The dataset file `evals/datasets/scope.json` is **not** modified: the classifier criteria
  do not change (D3), so the existing scope expectations still hold and the new
  post-scope expectations are expressed in the test file itself.
- `scripts/chat-live-eval.ts` — add post-scope cases (see §8).
- `docs/architecture/system-architecture.md` — add the two routes to the runtime route
  inventory and the new Redis responsibility to the concerns table. The inventory currently
  omits the *existing* `/api/chat` and `/api/chat/session`; add those too while there.
- `docs/adr/0004-blog-ask-panel.md` — the ADR (see §9).
- `src/pages/AGENTS.md`, `src/components/AGENTS.md` — note the new route, component, and
  utility if those files are hand-maintained.

**Not touched:** `src/pages/api/chat.ts` keeps its current contract and behaviour; the
`/ask` page keeps its layout; `src/data/chat-index.json` keeps its shape and contents;
`evals/datasets/scope.json` keeps its contents.

**New build gate.** `scripts/build-post-sections.mjs` fails the build if the generated
`src/data/post-sections.json` is not byte-identical to what is committed. The release
check gains a bundle-size assertion: the gzipped server bundle must stay under 2.5MB.
Today it is ≈1.55MB gzipped; the new corpus adds ≈194KB, landing near 1.75MB, against
the 3MB compressed limit for the Workers Free plan.

---

## 7. The post endpoint in detail

`POST /api/chat/post`, `prerender = false`.

**Request** (JSON, ≤16KB body, same `readLimitedText` helper):

```json
{ "post": "kubernetes-docker", "mode": "ask", "question": "why did he pick Postgres?" }
```

- `post` — required. Normalized with `toPublishedPostSlug`, then checked against the
  published-post manifest with `isPublishedPostSlug`. Unknown or draft slug ⇒ 422. The
  slug never selects text; it selects *from the server's own artifacts*.
- `mode` — `summary` or `ask`.
- `question` — required for `ask`, ignored for `summary`; ≤500 chars, sanitized with the
  existing `sanitizeUserText`.

**Order of operations**, mirroring `/api/chat` exactly so the two endpoints behave alike:

1. `isAllowedFormOrigin` ⇒ 403.
2. Body size ⇒ 413.
3. Configuration check — session secret, Turnstile secret, rate limiter, and Redis all
   present ⇒ 503 otherwise. This mirrors `/api/chat`'s fail-closed check and happens
   before any quota is spent.
4. Verify the `x-chat-session` header against the IP-bound HMAC session ⇒ 401. Required
   for **both** modes (D8). As in `/api/chat`, the session check precedes body parsing, so
   an unauthenticated caller learns nothing about the request shape.
5. Per-IP request limits for the mode ⇒ 429. These count requests, hits and misses alike.
6. Parse and validate against the zod schema ⇒ 422. Resolve the slug against the manifest
   ⇒ 422 if unknown. Resolve the note's sections from `post-sections.json` ⇒ 422 if the
   note has none.
7. `mode: "summary"` — read the Redis cache. Hit ⇒ replay the cached text as
   `text-start` / `text-delta` / `text-end` plus the note's source parts, and stop. **No
   model call and no global counter consumed.** Miss ⇒ continue; if Redis is unavailable,
   503 without calling the model.
8. `mode: "summary"` — consume the global generation cap ⇒ 429. Generate the summary
   through the normal model chain, with the guard. Write the result to Redis with a
   30-day TTL, then stream it.
9. `mode: "ask"` — consume the global question cap ⇒ 429. Then the scope check via
   `classifyScope` with the post-scope input shape ⇒ a `POST_REFUSAL` stream on NO, with
   no answer call.
10. Build the context: the note's sections in order, then the fallback chunks, then the
    facts chunk.
11. Stream the answer through the same `streamText` chain, the same canary, and the same
    guard. Emit `data-trace` with scope `post` and the usual fields.

**Response.** The same UI message stream as `/api/chat`, with `Cache-Control: no-store`
and `X-Content-Type-Options: nosniff`.

**Trace shape.** `ChatTrace['scope']` gains `'post'`. `verdict`, `sources`, `provider`, and
`guard` are unchanged. Post scope reports `scope: 'post'` for both an answered and a
refused question — `verdict` already distinguishes `answered` from `refused`, so the trace
stays meaningful. The `/ask` client gets a label for the new member; it will never observe
it.

**Per-IP summary limits count requests, not generations.** A reader who opens the panel on
21 articles in a day would hit a 20/day request cap on summaries that were already cached
and cost nothing. The per-IP cap is therefore **30/day** for summary requests — above the
51-note worst case is still possible, so the cap is set at 60/day, comfortably above any
realistic browsing session, and the *generation* pressure is bounded separately by the
global 60/day miss cap. A summary request that is rate-limited returns the same
rate-limit copy as a question; the reader still gets the static orientation and the
composer.

---

## 8. Testing

**Unit** (`bun run test:unit`):

- `chat-post-context.test.ts` — slug resolution; the note's sections come back complete and
  in order with their code; a note with no headings still yields a section; the digest is
  stable for the same content and changes when the content changes; a draft or unknown slug
  resolves to nothing; fallback chunks never come from the note itself; the note's own
  title appears in the context.
- `chat-answer-text.test.ts` — the parser's block output for paragraphs, bullets, bold,
  inline code, and links; a link whose host is not on the allowlist is not rendered as a
  link; no raw HTML is ever produced.
- `chat-pipeline.test.ts` — extended: site scope behaves exactly as before; post scope
  refuses an off-topic question with zero sources and emits `POST_REFUSAL`; post scope
  answers an in-scope question with the note's sections in the context; the guard still
  blocks a canary leak on the post path; a summary is never refused; post scope emits
  `scope: 'post'` in the trace.
- `chat-evals.test.ts` — the deterministic tier asserts what it can without a model: that
  post scope always routes to the classifier rather than auto-allowing, that the post
  context resolves to the right note, and that the guard holds on the post path. Verdict
  assertions for post scope live in the live eval, where a real classifier is available —
  the same split the existing scope dataset already has.

**End to end** (`bunx playwright test tests/post-ask.spec.ts`):

- The trigger renders on an article page and not on `/blog/` or `/`.
- The trigger is a link to `/ask?q=…` before hydration; JS upgrades it to open the panel.
- Opening the panel shows the note title and description immediately, and issues a summary
  request; on a cache hit the server spends no model call.
- The summary arrives over the stubbed stream and renders as text.
- A question streams an answer, renders source chips, and sends `post` and `x-chat-session`
  in the request body and header.
- Opening the panel on a desktop viewport reserves the right margin and the prose
  reflows left; the panel never overlaps the prose column (D12).
- Esc closes the panel and focus returns to the trigger.
- A 429 renders the rate-limit copy, not a stack trace.
- Without JavaScript the article is complete and the trigger still navigates to `/ask`.

**Live eval** (`bun run eval:live`) — add post-scope cases to
`scripts/chat-live-eval.ts`: a grounded answer about the note, a refusal for an off-topic
request, and a check that the answer's sources include the note. This gate must pass
before the caps in D9 are raised.

---

## 9. ADR

`docs/adr/0004-blog-ask-panel.md` records: post scope as a second routing mode on the
existing assistant; full-note, section-aware context with bounded site fallback; the
unchanged classifier criteria with a second input shape; the summary cache as Redis
operational state with a content-digest key, and the explicit statement that Redis is *not*
becoming a content store — the note text stays in the build artifact and the cache holds a
TTL'd memoized answer; the runtime site-key endpoint and the reason the build cannot inline
it; the layout reservation that keeps the panel off the prose; and the neuron-denominated
budget. It also amends ADR-0001 item 6, which today limits Redis to "rate limits and
reaction counters".

---

## 10. Risks, and what happens if they land

| Risk | Mitigation |
|---|---|
| A viral post drains the free tier | The budget is stated in neurons against a measured 10,000/day allowance; per-IP and global caps; the summary is cached, so only the first reader of a note per window pays; `/ask` keeps its own bucket. |
| The classifier refuses legitimate note questions | The criteria already cover "views expressed in his articles"; the post-scope input names the note so a bare "why?" is judged in context; a refusal is visible in the trace, not silent. |
| The summary is stale | The cache key contains a build-time digest of the note's content; editing the note changes the digest and the summary is regenerated. |
| Redis is down | Summary and questions fail closed with an honest message. The article is unaffected. |
| The panel covers the prose | On desktop the article reserves the margin and the prose reflows (D12); below 1024px it is a bottom sheet the reader can scroll past. Verified at 375 / 768 / 1024 / 1280 / 1440 / 1920. |
| The panel drifts from `/ask` | One pipeline, one guard, one classifier, one session model, one trace shape. The panel has no prompt of its own — only a mode. |
| A reader asks something the note does not cover | The prompt requires saying so; the trace shows whether fallback pages were used; sources name the page. |
| The bundle grows | The new corpus is additive and measured at 194KB gzipped; the release check asserts a 2.5MB gzipped ceiling. |
| Prompt injection through the reader's question | The question is sanitized, the scope check runs before the model, the context is untrusted data, the canary and the guard are unchanged. |
| A note's MDX components are missing from the context | 10 of 51 notes embed MDX components whose rendered content a text extractor cannot see. The artifact preserves prose, headings, and code; component-rendered output is not recoverable from source and is not claimed to be. |

---

## 11. Left for the builder

These are explicitly delegated, with the constraint that the result must read as the
existing Evidence Ledger world, not a new one:

- Exact wording of the summary instruction and the answer instruction.
- Whether the summary renders as bullets or short paragraphs (both are supported by the
  parser; pick whichever reads better in a 400px panel and state the choice in the PR).
- The exact SVG glyph for the trigger.
- Whether the section buttons are labelled with heading text alone or with a short
  affordance prefix.
- The client-side animation curve, within the reduced-motion constraint.
- The exact right-margin gap reserved for the panel, and the transition used when the
  prose reflows.

Not delegated: anything touching scope, quota, guard, caching, the no-JS contract, the
layout reservation, or the `/ask` path.

---

## Appendix: review findings that changed this document

A fresh reviewer read this design cold, twice, and cross-checked it against the repository
and against Cloudflare's published pricing. Seven findings changed it.

1. **The classifier criteria did not need extending.** The reviewer flagged that the
   original "extend the criteria by one clause" would have widened `/ask` while the same
   document promised `/ask` would not change. Re-reading `src/utils/chat/models.ts`, the
   criteria already include "writing, views expressed in his articles", so a note-content
   question is already in scope. The clause was deleted and replaced with D3: unchanged
   criteria, a second input shape.
2. **The quota arithmetic counted questions where it should have counted neurons.** The
   original "860 calls/day" was wrong on two counts — every question is two calls, and the
   free tier meters neurons, not calls. D9 now derives the caps from Cloudflare's published
   per-model rates against the 10,000 neuron/day allowance, and states the realistic
   steady-state figure.
3. **A cache hit was being charged to the generation cap.** The original ordering charged
   60 cached opens a day against the summary budget and gave a reader a spurious 429 after
   11 posts. The global counter now counts misses only; per-IP request limits still count
   everything, at a rate that does not punish browsing (§7).
4. **Summary mode had no defined context.** The original applied the question-mode context
   builder to both modes, which would have made a summary of the wrong thing and broken the
   cache-key contract. D11 gives summary mode its own context: the note only.
5. **The file inventory was incomplete.** `tests/chat-pipeline.test.ts`,
   `tests/chat-evals.test.ts`, and `scripts/chat-live-eval.ts` are now named in §6, and §8
   states which tier gates the scope change. `evals/datasets/scope.json` is explicitly
   *not* modified, because the criteria do not change.
6. **The right-anchored panel covers the prose, and the stated mitigation was false.** The
   reviewer measured the built site and found a 400px right-anchored panel overlapping 48%
   of the prose at 768px and 30% at 1440px, contradicting the document's own anti-goal.
   Re-measured independently here: overlap at every width from 768 up. D12 replaces the
   overlay with a **layout reservation** — the article gives up the right margin and the
   prose reflows — which is the only way to keep the promise.
7. **Two published notes have no headings at all**, and 10 of 51 embed MDX components that
   a text extractor cannot see. D1 now specifies a synthetic root section for a
   heading-less note, and §10 states the MDX-component limitation plainly instead of
   implying a faithful rendering.
