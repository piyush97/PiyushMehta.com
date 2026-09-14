# Traffic growth: implementation and next 30 days

Prepared 14 September 2026. Goal: grow technical readership and qualified consulting/recruiting interest equally.

## What the audit established

Live responses from `https://piyushmehta.com` on 14 September exposed malformed discovery URLs:

- `sitemap.xml`: `https://piyushmehta.com//about/` and double-slash article URLs.
- `robots.txt`: `Sitemap: https://piyushmehta.com//sitemap.xml`.
- `rss.xml`: article links such as `https://piyushmehta.com//blog/testing-ai-agent-actions/`.
- The sitemap omitted `/services`, `/react-developer`, `/resume`, and `/newsletter`.
- Static pages received a new `lastmod` on every sitemap request, regardless of editorial changes.
- Source CSS hid every `[data-reveal]` element until deferred JavaScript ran. The motion script subsequently replaced complete hero headings with delayed, initially invisible character spans.
- Blog route generation and related-post recommendations did not exclude drafts, even though listings and feeds did.

The existing Cloudflare PDF covers 23–30 August, reports LCP p75 of 3,300 ms, and shows only a handful of observations and insufficient INP data. It is a reason to investigate loading, not a reliable traffic baseline or proof of a site-wide trend. It does not contain search queries, impressions, click-through rates, or qualified-lead counts. No keyword-volume, ranking, or growth claims can be supported from that export.

## Implemented in this branch

1. Use one canonical URL builder for HTML, sitemap, article schema, and RSS article links. Strip tracking parameters and fragments from canonical URLs.
2. Generate sitemap, robots, and RSS at build time, so discovery does not depend on runtime Worker execution.
3. Add the four omitted business/subscription pages to the sitemap. Keep tag redirects, utility pages, and drafts out.
4. Remove fictitious sitemap modification dates; use an optional `updatedDate` for genuine article revisions, consistently in sitemap and article metadata.
5. Preserve existing RSS item identifiers as opaque GUIDs while repairing their navigable links. Escape custom XML, remove repeated categories, and let feed generation failures stop the build.
6. Exclude drafts from direct route generation and related-post recommendations.
7. Keep server-rendered content visible without JavaScript. Only offscreen elements opt into reveal animation; hero headings remain complete when motion initializes.
8. Clarify the blog's search title and reading-path heading. Add direct consulting, project, and résumé links in the writing journey, including consulting from the existing article author card.
9. Add a required build check that verifies each sitemap URL against its actual built HTML canonical, article dates, RSS coverage, and the robots sitemap location.

These changes remove specific obstacles to discovery and conversion. Search engines still determine crawling, indexing, and ranking; assess outcomes after deployment.

## First deployment and baseline

- Deploy this branch through the existing review/Workers Builds workflow.
- Fetch the three discovery files on production and verify the URLs no longer contain double slashes. Cloudflare adds managed bot directives to production robots.txt; this branch leaves that account setting alone.
- In Search Console, submit `https://piyushmehta.com/sitemap.xml`. Inspect `/services`, `/resume`, and two priority articles. Record Google's selected canonical and index status; request indexing for the changed priority pages where appropriate.
- Export the preceding 28 complete days of Search Console page and query data, with the same country/device/search-type filters for later comparisons. Separate branded queries containing Piyush or the domain from topic queries.
- Record qualified consulting and recruiting inquiries separately, and the page/source they mention. A contact-link click is not a qualified lead. Record newsletter subscriptions separately as a readership outcome.
- After 28 complete post-deployment days, compare non-branded search clicks, article landing visits, newsletter subscriptions, and qualified inquiries with the baseline. Use page/query detail to choose the next change; low counts require a longer observation window.

Do not claim a performance improvement from localhost timings. Recheck field LCP after deployment with more observations. Target p75 LCP at or below 2.5 seconds; report sample limitations alongside it.

## Continue the existing content plan

The [September content and career plan](2026-09-content-and-career-plan.md) already contains the publication sequence, agent-action distribution drafts, and a credibility review queue. Keep that sequence: operating-cost breakdown with real bills, a reproducible RAG experiment, then an Interview Prep Portal case study. This audit adds the discovery fixes and a consulting objective; it does not create a competing editorial calendar.

Use Search Console evidence to refine that queue after the baseline exists. Prioritize content that answers a specific technical question and gives readers a relevant next step into `/services`, `/projects`, or `/resume`. Preserve stable article URLs, verify first-person/quantitative claims before promotion, and add `updatedDate` only when a substantive revision ships.

### Additional LinkedIn draft: migration and consulting

**Cloudflare migration**

Moving this Astro site from Vercel to Cloudflare exposed a boundary I had to make explicit: code that can run during a build is not necessarily code that can run inside a Worker.

The migration affected the Redis client, native social-image rendering, and where generated assets were served. I wrote down what broke and how the fixes fit together for anyone considering the same move.

https://piyushmehta.com/blog/vercel-to-cloudflare-migration?utm_source=linkedin&utm_medium=social&utm_campaign=astro_migration

Use campaign tags only on external distribution links. Keep internal links and canonicals clean. This draft is for review and manual publication; sending is a separate action. No social posts or broadcasts have been sent.

## Validation and maintenance

- `bun test tests/discovery.test.ts`
- `bunx playwright test tests/traffic-growth.spec.ts --project=chromium`
- `bun run check`
- `bun run build` (includes `scripts/verify-discovery.mjs`)

The isolated QA preview can run at a different port by setting `TRAFFIC_TEST_URL`; the test configuration must point to that server as well. Search/RSS URLs intentionally retain the production host during local QA.

Before adding an indexable landing page, add it to the sitemap and verify its self-canonical and internal links. A new article needs a useful description, source-backed claims, and links to relevant existing work. Avoid changing titles or dates solely to imply freshness.

## References checked

- [Google: Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): absolute canonical URLs; accurate lastmod. Google ignores priority and changefreq.
- [Astro: On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/): opt endpoints into prerendering under server output.
- [Astro: Content collections](https://docs.astro.build/en/guides/content-collections/): filter getCollection results before generating routes.
- [Astro: RSS](https://docs.astro.build/en/recipes/rss/): configured site URL and feed generation.

Astro documentation was fetched with Context7; the installed RSS implementation was also inspected to verify how custom GUID XML overrides automatic permalink GUIDs.
