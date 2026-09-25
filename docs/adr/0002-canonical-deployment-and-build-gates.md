# ADR-0002: Use the generated adapter config and fail closed on shipped artifacts

- **Status:** Accepted — source implementation complete; production verification pending
- **Date:** 2026-09-24
- **Decision owners:** Piyush Mehta
- **Architecture:** [System architecture](../architecture/system-architecture.md)

## Context

The Astro Cloudflare adapter produces a Worker entrypoint and a generated Wrangler configuration under `dist/server/`. The generated configuration points to `dist/server/entry.mjs` and serves `dist/client/` as static assets. The repository also contains a root `wrangler.jsonc` whose asset directory is `./dist`; the package and README now target the generated config, while CI and the external Workers Builds settings still need verification.

Those paths describe different artifact boundaries. A root-config deployment could expose server implementation files as public assets or fail to find the intended static output. The build also marks Pagefind optional even though the site ships a search page, and a candidate post-build checker is not currently part of the release pipeline.

## Decision

1. Use the Astro-generated `dist/server/wrangler.json` as the canonical deployment configuration.
2. Treat `dist/client/` as the public static asset directory and `dist/server/` as Worker implementation output.
3. Use the same generated configuration for local preview, CI artifact validation, Cloudflare Workers Builds, production deployment, and rollback verification.
4. Do not upload `dist/server/` as public static content.
5. When a shipped route depends on Pagefind, generated feeds, OG assets, redirects, or discovery metadata, a missing or invalid artifact fails the release.
6. Integrate the artifact checks into the actual build/deploy path; an unreferenced checker is not a release gate.
7. Keep the previous complete Worker version, including its static assets, available for rollback.

This ADR records the accepted contract. The package deploy command, README, CI artifact gate, clean-build pipeline, and article route now implement the source-side requirements. Cloudflare Workers Builds settings, deployed response headers, rollback behavior, and provider-backed failure paths remain production verification work.

## Consequences

### Positive

- The deployment boundary matches the Astro adapter's generated artifact layout.
- CI, preview, and production test the same release contract.
- A successful build means the shipped site is complete, not merely compilable.
- Server code and source maps are not accidentally published as static files.
- Rollback restores a coherent code-and-content version.

### Negative

- The deployment command must explicitly use the generated configuration.
- Root Wrangler settings remain shared input to adapter generation and must be kept compatible with it.
- Adding a new generated route requires adding or updating its artifact check.
- Builds take slightly longer because optional generated outputs become release requirements.

## Rejected alternatives

### Root configuration as the deployment contract

Rejected as the canonical path because its current `./dist` asset root does not match the adapter-generated `../client` boundary. It could be made equivalent, but that would duplicate the generated contract.

### Continue deploying partial builds

Rejected because a deployment with a dead search page, missing social cards, or incomplete discovery metadata is not an acceptable production release.

### Treat `dist/server` as an asset directory

Rejected because implementation modules, generated configuration, and source maps are not public website content.

## Related decisions

- Public article content remains build-time MDX under [ADR-0001](0001-keep-public-content-build-time.md).
- Giscus comments remain disabled until real identifiers and matching CSP origins are separately approved.
- Newsletter success means the Resend contact was created and a welcome email was attempted; it does not claim double-opt-in confirmation until that flow exists.
- The target newsletter form requires an explicit consent control before submission.
- Reactions remain anonymous, eventually consistent counters bounded to a build-generated published-post manifest.
