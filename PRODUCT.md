# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary readers are software engineers, technical leads, engineering managers, and developers evaluating Piyush Mehta's judgment before trusting his work or engaging him. They arrive from search, shared links, the writing archive, or a case study and need to understand a real engineering argument quickly, then decide whether to keep reading, reuse an implementation detail, or continue to a related field note.

## Product Purpose

PiyushMehta.com is a public engineering record and technical journal. It presents field notes, implementation lessons, architecture decisions, and case studies as inspectable evidence of how Piyush thinks and ships. Success means a reader can find the thesis, understand the supporting reasoning, locate practical detail, and find a credible next step without the page behaving like a marketing funnel or a generic dashboard.

## Positioning

The site is differentiated by first-person engineering evidence: real constraints, explicit tradeoffs, implementation details, and outcomes rather than broad claims. Its articles are field notes for people who need to make or evaluate technical decisions under real constraints.

## Operating Context

- Content is authored as MDX in `src/content/blog/` and rendered as prerendered Astro routes.
- The site is published as a Cloudflare Workers application with static assets and a small set of runtime API routes.
- Article discovery uses Pagefind; article metadata and structured data are part of the publishing contract.
- Reactions use the existing Upstash-backed API and local optimistic state. Contact delivery uses Resend.
- The repository is content-led: no application database is used for publishing.
- Public routes share navigation, theme controls, responsive behavior, and the Evidence Ledger design direction.

## Capabilities and Constraints

- Every published article must retain its authored MDX content and factual meaning.
- Article routes must keep titles, descriptions, dates, authors, tags, canonical URLs, Open Graph metadata, and Article structured data accurate.
- Reading orientation, table-of-contents navigation, deep links, sharing, reactions, next-read recommendations, related posts, and archive links are existing product capabilities and must remain usable.
- Layout and supporting interaction patterns may change when they improve orientation, reading comfort, or continuation without changing article facts.
- Interactive evidence islands embedded in MDX must remain usable at narrow widths, keyboard accessible, and readable in both themes.
- The site must work in dark and light themes, at mobile and desktop widths, with keyboard navigation, visible focus, reduced motion, and readable contrast.
- Draft handling, prerendering, RSS, sitemap, redirects, and release checks remain build and publishing constraints.
- No invented testimonials, clients, metrics, credentials, outcomes, or technical claims may be added to fill visual space.
- WebKit and mobile Safari coverage is not currently available in the local Playwright environment; broader browser validation remains an external follow-up.

## Brand Commitments

- The public identity is Piyush Mehta.
- The voice is direct, specific, technically literate, and candid about constraints and tradeoffs.
- Claims should be demonstrable through code, operating details, case evidence, or clearly attributed experience.
- The site is an engineering record first, not a personal-brand template or a lead-generation funnel.

## Evidence on Hand

- 40 published MDX field notes in `src/content/blog/`, with authored descriptions, dates, tags, and optional images.
- Typed portfolio and case-study data in `src/data/portfolio.ts`, including FocusTube, enterprise AI workflows, platform work, homelab/GitOps work, and community education.
- Existing article components for metadata, table of contents, reactions, recommendations, related posts, sharing, and career context.
- Real article imagery and code samples in the MDX collection.
- No verified customer testimonials or invented audience claims are available; future work must not fabricate them.

## Product Principles

1. Make the argument legible before making the page impressive.
2. Show constraints, decisions, and evidence instead of hiding them behind claims.
3. Give a reader a reliable orientation path at every point in a long article.
4. Make practical implementation detail findable without interrupting the reading flow.
5. End an article with a credible, content-based way to continue.

## Accessibility & Inclusion

The article experience must remain operable by keyboard and assistive technology, retain visible focus states and comfortable touch targets, preserve readable contrast in both themes, respect reduced-motion preferences, and keep the reading measure and hierarchy comfortable on small screens. Article content must remain available without client-side JavaScript.
