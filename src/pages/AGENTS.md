# Route Guidance

## OVERVIEW
Astro page and endpoint routes compose the site's rendered views; score 9 (25 files, 150 declaration names, 36 export declarations).

## WHERE TO LOOK
- `blog.astro`: published-post listing, excerpts, reading time, and reading-path configuration.
- `blog/[slug].astro`: post path generation, MDX rendering, and related article assembly.
- `api/contact.ts`: contact submission validation and delivery.
- `api/reactions.ts`: reaction read/write endpoint.
- `rss.xml.ts`, `sitemap.xml.ts`, `robots.txt.ts`: crawler-facing output.

## CONVENTIONS
- Route exports are framework entry points (`GET`, `POST`, `getStaticPaths`); keep them in the route file Astro discovers.
- Dynamic blog routes derive their public slug from the collection ID, stripping `/index` and the MD/MDX extension.
- `blog/[slug].astro` filters drafts in `getStaticPaths`; listing queries should use the same published-post condition.
- API handlers validate request data before calling shared utilities and return explicit status-bearing `Response` values.
- `api/contact.ts` returns 503 when its rate limiter is unavailable, before delivery.
- Page data is assembled at the route boundary from content collections and typed portfolio data; shared transformation belongs in existing utilities when multiple callers need it.
- Blog excerpts strip code, images, HTML, and Markdown syntax before deriving fallback summaries.
- The listing's reading-time estimate uses 200 words per minute and floors empty posts at one minute.
- Social-card metadata and blog recommendations already live in `src/utils/`; route code should compose those helpers.
- Keep crawler-facing XML routes aligned with the same published-content set used by the HTML listing.
- The home and content routes import shared layout and presentation components directly rather than through a central route barrel.

## ANTI-PATTERNS
- Do not add a route that bypasses Astro's file-based routing convention.
- Do not expose draft content by using an unfiltered collection in published-route generation.
- Do not move request validation into a component; API validation belongs at the endpoint trust boundary.
- Do not duplicate route-local content normalization when the same helper already serves another route.
