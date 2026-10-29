---
id: content
type: module-design
status: draft
title: Publishing content
parent: architecture
references: [adr-public-content]
---

## Responsibility

Versioned MDX is the editorial source for the technical journal; the content collection validates article metadata. Chat facts supplement published writing and portfolio data for retrieval.

## Boundary

Only published articles belong in public routes and generated discovery artifacts. Authored content is not a runtime editorial database; see `adr-public-content`. _(Boundary inferred from implementation; unconfirmed.)_
