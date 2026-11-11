# Maintaining

## Newsletter

Readers subscribe with `SubscribeForm.astro`. The flow is double opt-in:

1. `POST /api/subscribe` checks origin, rate limits (3 per hour per IP, 2 per day per address, 50 per day overall) and Turnstile, then emails a signed confirm link through Resend. It answers the same way for new and already-subscribed addresses.
2. `GET /api/subscribe/confirm?token=...` verifies the token (48 hour expiry) and shows a confirm button, so mail scanners that prefetch links cannot subscribe anyone. `POST` adds the lowercased address to the Upstash Redis set `newsletter:subscribers`.
3. Every post email carries a signed unsubscribe link and `List-Unsubscribe` headers. `GET /api/subscribe/unsubscribe` only shows a button; `POST` removes the address.

Storage is the Redis set, not a Resend Audience, so no new Resend API surface is used. Application logs never print addresses, but the confirm and unsubscribe tokens carry the address base64url-encoded in the query string, so request URLs in Worker invocation logs can be decoded to one.

Required runtime bindings: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, Upstash Redis, and `NEWSLETTER_SIGNING_SECRET` (32+ random characters). The endpoint returns 503 if any are missing. Rotating the signing secret invalidates outstanding confirm and unsubscribe links.

### Sending a new post

The script never runs on deploy. It is a dry run unless `--send` is passed.

```bash
bunx varlock run -- bun scripts/send-new-post.mjs <post-slug>          # counts only
bunx varlock run -- bun scripts/send-new-post.mjs <post-slug> --send   # delivers
```

Run it after the post is live. It refuses drafts, skips addresses already mailed for that slug (Redis set `newsletter:sent:<slug>`, which expires 30 days after the last send), and prints counts only. Rerun the same command to retry failed deliveries.
