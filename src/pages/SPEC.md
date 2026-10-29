---
id: routes
type: module-design
status: draft
title: Public routes and APIs
parent: architecture
depends-on: [content]
references: [adr-chat, adr-public-content]
---

## Responsibility

Astro routes assemble public pages, feeds, discovery assets, and runtime endpoints for contact, reactions, and Ask Piyush.

## Boundary

Public article routes exclude drafts. Runtime handlers validate requests and use shared utilities for service access; contact and chat fail closed when required safeguards are unavailable. Chat's scope and security contract lives in `adr-chat`. _(Boundary inferred from implementation; unconfirmed.)_
