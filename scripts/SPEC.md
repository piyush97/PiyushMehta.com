---
id: build-pipeline
type: module-design
status: draft
title: Build and release pipeline
parent: architecture
depends-on: [content]
references: [adr-deployment, adr-chat]
---

## Responsibility

Build scripts generate published-content and chat indexes, prepare assets, run Astro and Pagefind, and verify release artifacts.

## Boundary

Generation runs before deployment; generated public assets and Worker output must honor `adr-deployment`. The retrieval index is built from published content, not fetched at query time; see `adr-chat`. _(Boundary inferred from implementation; unconfirmed.)_
