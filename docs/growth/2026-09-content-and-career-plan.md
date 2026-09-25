# September content and career plan

Positioning: senior software engineer building reliable AI systems and web platforms, based in Canada and open to remote teams.

## Prepared in this change

- Explicit hiring invitation on the homepage and after articles.
- Three reading paths on the blog index: production AI, reliable backend systems, developer tools.
- Article: `/blog/testing-ai-agent-actions/`.
- Downloadable evaluation script and twelve fixtures: `/examples/agent-action-evals/`.
- Distribution drafts below. Nothing has been sent to social networks, communities, or email.

## Available baseline and gaps

The workspace Cloudflare Web Analytics PDF covers August 23, 2026 11:34 through August 30, 2026 11:34, UTC-04:00, with bots excluded. It reports LCP p50 2,753 ms, p75 3,300 ms, p90/p99 3,950 ms; 20% good and 80% needs improvement. INP has no data, and the export says there is not enough data for Web Analytics. These are limited performance observations, not traffic or conversion figures. Do not interpret the five URL rows as five visits or as a representative sample.

Traffic, organic queries, referrals, résumé visits, relevant inquiries, and interviews remain unknown. Existing optional gtag calls do not prove an analytics collector is installed. A Cloudflare-injected beacon may be configured outside the repository. No new tracker is added here.

To establish acquisition performance, obtain a Search Console export by query and page for the most recent complete 28 days and the preceding 28 days, plus Web Analytics page/referrer totals for matching dates. Keep identifiable inquiries and raw exports outside public source control. Record aggregate results only.

| Metric                                         | Baseline | Weekly interpretation                                                                        |
| ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| Organic clicks and impressions                 | Unknown  | Which relevant problems are earning discovery?                                               |
| Visits to article, work, résumé, contact pages | Unknown  | Are readers exploring the professional work? Separate counts do not establish a user funnel. |
| Relevant hiring inquiries                      | Unknown  | Manually classify role fit and source; avoid storing personal details in this public repo.   |
| Interviews attributable to content             | Unknown  | Ask contacts what brought them here; do not infer attribution from page views.               |

Use campaign parameters only on external distribution links. Example: `?utm_source=linkedin&utm_medium=social&utm_campaign=agent-action-evals`. Do not put UTMs on internal navigation. Verify the chosen analytics system actually reports these parameters before relying on them.

## Four-week publishing sequence

Dates are targets, not scheduled automations or promises of traffic growth.

| Week                   | Deliverable                                                                     | Evidence needed before publication                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| September 7–13         | Agent-action testing article and runnable harness; hiring CTA and reading paths | Local fixture output and rendered page verification                                                                   |
| September 14–20        | Website operating-cost breakdown, following the migration article               | Redacted actual bills, billing period, usage totals, free-tier limits; distinguish cash cost from engineering time    |
| September 21–27        | Improve the existing RAG-vs-long-context article with a reproducible experiment | Shareable documents, labeled questions, fixed configuration, repeated runs, measured cost/latency; no invented winner |
| September 28–October 4 | Interview Prep Portal evaluation case study                                     | Inspect the real implementation; synthetic resumes, explicit rubric, counterexamples, limitations                     |

Future queue: retry/idempotency deep dive; AGENTS.md controlled experiment; homelab restore drill; anonymized enterprise AI workflow. Select the next item using both search evidence and relevance to target roles.

## Distribution packet: agent-action article

Use these after the article is live and the public downloads work. Review as Piyush's own voice before sending.

### LinkedIn draft

An AI agent creates a ticket, loses the response, and retries. Did you just create two tickets?

I built a small runnable example to test the action boundary: approvals, project access, changed arguments, and duplicate requests.

The guarded version passes twelve fixtures. Bypassing the gate fails eleven of them. Both modes are local simulations; there are no model calls or external writes.

The point is to inspect what changed in the system, alongside what the agent said happened. The article also explains why an in-memory request map is not a production idempotency solution.

Code and walkthrough: https://piyushmehta.com/blog/testing-ai-agent-actions/?utm_source=linkedin&utm_medium=social&utm_campaign=agent-action-evals

I’m open to senior software engineering and applied AI opportunities with teams building dependable products.

### Community post draft

Title: A tiny runnable harness for agent approvals and duplicate retries

I made a dependency-free example that tests a tool-action gate with twelve JSON fixtures. It checks both return values and mock writes. There is also an intentionally unsafe mode so you can see which checks catch the missing controls.

It does not evaluate a model, simulate distributed crashes, or provide production storage. I would be interested in additional boundary cases people test before connecting agents to write-capable tools.

Walkthrough and downloads: https://piyushmehta.com/blog/testing-ai-agent-actions/

Share only in relevant communities that allow original work; include the explanation rather than dropping a bare link.

### 60-second demo outline

1. Show an approved ticket and the duplicate-retry fixture.
2. Run the guarded harness: one write, duplicate recognized.
3. Run unsafe mode: two writes, fixture fails.
4. Explain that the model is outside this test and durable storage is outside the demo.
5. Point to the article and downloadable fixtures.

### Meetup proposal draft

Title: Testing AI Agents That Can Take Actions

A practical 20-minute session showing how to separate model proposals from execution authority. We will run a twelve-fixture harness, break the approval and retry controls, and discuss what remains untested when a deterministic gate passes. Attendees leave with two files they can run without API keys.

## Credibility review queue

Before amplifying the existing articles, verify the supporting evidence and personal contribution behind:

- `zero-downtime-database-migration-at-scale`: first-person 50TB migration, growth, performance, and cost claims.
- `ai-chat-system-design-million-users`: first-person scale and incident claims.
- `ats-resume-software-engineer`: 75% auto-rejection statistic.
- `first-90-days-new-software-engineer-job`: 30% failure statistic.

These claims are unverified in this task, not established as false. Supply sources or personal records; clearly label hypothetical examples where appropriate. Do not invent substantiation or silently recast real experience.
