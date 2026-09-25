# ADR-0001: Keep public content build-time and database-free

- **Status:** Accepted
- **Date:** 2026-09-24
- **Decision owners:** Piyush Mehta
- **Architecture:** [System architecture](../architecture/system-architecture.md)

## Context

PiyushMehta.com publishes technical articles from versioned MDX through Astro and is deployed on Cloudflare Workers. The site must absorb viral article traffic while retaining small operational APIs for reactions and contact delivery; social cards are generated as build-time assets.

A database and application cache for the latest-article list were considered. That design would make every latest-article request depend on a runtime data store even though article publication already requires a successful build and deployment. It would also duplicate content that is already present in the deployment artifact.

The site currently has no runtime editorial workflow, user accounts, approved comment workflow, relational reporting requirement, or application-owned lead/subscriber registry.

This decision assumes the deployment pipeline will use one verified Wrangler configuration so the Worker entrypoint and `dist/client` assets are released together. The current root-versus-generated configuration ambiguity is tracked as a release-hardening issue in the system architecture document.

## Decision

1. Git and MDX are the source of truth for public articles and their ordering.
2. Astro generates article pages and latest-article content during the production build.
3. Cloudflare Workers Static Assets serves the public content from the edge.
4. A latest-article request will not query Redis or a database.
5. Cache optimization will focus on static asset delivery, ETag revalidation, fingerprinted immutable assets, and measured page performance.
6. Upstash Redis remains limited to explicitly ephemeral or operational state such as rate limits and reaction counters.
7. Resend remains the authority for contact email delivery.
8. No application database will be added until a named feature requires durable, relational application state.

## Consequences

### Positive

- Article availability does not depend on Redis, Resend, or a database.
- Viral page traffic is absorbed by the edge rather than by runtime data queries.
- Content and article ordering change atomically with deployment.
- Operational state and its failure modes remain small and understandable.
- The project avoids unused schema, migrations, repositories, and backup responsibilities.

### Negative

- Publishing requires a reviewed Git change and successful deployment.
- Article metadata is not queryable or editable at runtime outside the build.
- A runtime CMS, user-content feature, or local lead registry will require later architecture work.
- The current content freshness contract is deployment-based rather than read-after-write.

## Rejected alternatives

### Redis-backed latest articles

Rejected because Redis would become a second copy of build-time content without improving freshness. It would add network latency, serialization, invalidation, and an availability dependency to data already available as a static deployment artifact.

### D1-backed latest articles

Rejected for the same reason. D1 is a reasonable future choice for relational application data, but it is not a useful cache or catalog for prerendered MDX today.

### Runtime CMS

Deferred because the current product does not require non-technical publishing or preview workflows. A CMS would introduce content ownership, synchronization, editorial state, migration, and preview concerns.

### Generic cache abstraction

Rejected because the site has distinct immutable assets, mutable HTML, private form operations, and ephemeral reactions. One generic cache abstraction would obscure those different consistency contracts.

## Revisit triggers

Reopen this ADR when at least one of the following becomes a product requirement:

- Non-technical users must publish or schedule articles without a deployment.
- Articles require drafts, previews, collaborative editing, or complex editorial workflows.
- Contact inquiries need durable status, assignment, retention, or audit history.
- The application must own subscriber state independently of Resend.
- Comments, user profiles, moderation, or tenant-specific content are introduced.
- Relational reporting or local event retention is required.
- An existing legacy database must be integrated.

A new ADR should describe the data owner, schema or storage model, consistency contract, access controls, retention, backup and recovery, migration, and measured workload before implementation.
