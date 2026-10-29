---
id: presentation
type: module-design
status: draft
title: Presentation and interaction
parent: architecture
references: [visual-design, adr-chat]
---

## Responsibility

Shared Astro components render the site's interface; React islands support interactive demonstrations and chat where needed.

## Boundary

Components receive content from their callers and coordinate browser behavior through shared DOM hooks. Client navigation requires transition-aware initialization; visual direction is owned by `visual-design`. _(Boundary inferred from implementation; unconfirmed.)_

## Ask-to-contact handoff

Every answered Ask Piyush reply links to the contact form. On click, the visitor's question and the answer's source URLs go to `sessionStorage` under one versioned key. `ContactForm` reads that key once on mount, deletes it, clamps the values to the contact API limits, and prefills subject and message. The visitor still sends the form.

- `sessionStorage`, not URL params, keeps the question out of URLs, history, and referrers. The cost: when the link opens in a new tab or on another device, the form starts empty.
- The AI answer is never copied, so an incorrect answer cannot reach the inbox as if the visitor wrote it.
- Refused, unavailable, interrupted, and failed replies get no link.
- The contact API is unchanged; prefilled text goes through the same validation as typed text.
