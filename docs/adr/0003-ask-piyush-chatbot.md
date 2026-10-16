# ADR-0003: Ask Piyush, a scoped, streaming, eval-gated chatbot on free models

- **Status:** Accepted
- **Date:** 2026-10-16
- **Decision owners:** Piyush Mehta
- **Supersedes:** none. Narrows ADR-0001 item 6 (Upstash stays ephemeral/operational: rate limits only).

## Context

The site should show AI engineering skill, not only describe it. A public chatbot is an abuse and cost surface, so it must answer only about Piyush, cost nothing to run, stream, and be regression-tested.

## Decision

1. **Scope is enforced before the model.** Only greetings skip the check; every other question goes to a YES/NO classifier that sees the question plus titles of matching pages from the site's own index. Only an exact YES answers; NO refuses; a classifier outage reports unavailable. Keywords (his name, "hire", project names) are never proof of scope, because "Piyush, write quicksort" contains them.
2. **Retrieval is build-time BM25** over published posts, portfolio data, and `src/content/chat/facts.md` (`src/data/chat-index.json`). No vector store, no runtime embeddings, no network at query time.
3. **Models are free tier.** Workers AI primary, Groq fallback on quota/capacity errors only. Model IDs live in `src/utils/chat/models.ts`.
4. **Streaming uses AI SDK v7** UI message streams. Output passes a hold-back guard that blocks canary/system-prompt leaks, off-allowlist URLs, images, and HTML, including when split across deltas.
5. **No tools, no memory, no fetching, no client history.** Each question is answered on its own; client-sent turns are ignored because assistant turns can be forged. Model thinking is disabled so the output budget goes to the answer.
6. **Fail closed.** Missing session secret, Turnstile secret, or rate limiter returns 503. Turnstile yields an IP-bound HMAC session token (30 min); limits are per-minute, per-day, and a global daily cap.
7. **Evals gate changes.** Deterministic evals run in `bun run test:unit`. The live-model eval (`bun run eval:live`, 34 cases: grounded answers, held-out paraphrases, off-topic, injection, exfiltration, hallucination traps) runs against a local Worker with the real Workers AI binding.
8. User text is not stored. Only event names and counts are logged.

## Consequences

- Free quota is the capacity limit; exhaustion shows a polite unavailable state.
- Every non-greeting question costs one extra small classifier call (~0.5s).
- Follow-ups such as "tell me more" are not supported, since there is no history.

## Not done yet

- Llama Guard input screening (the classifier handles scope; unsafe-content screening is not separate).
- A CI job for the live eval (needs Cloudflare credentials in CI).
- Turnstile, Groq, and session-secret values must be provisioned before deploy.
