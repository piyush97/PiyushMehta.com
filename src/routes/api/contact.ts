// src/routes/api/contact.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { submitContact } from '../../features/contact/lib/service'
import { validateEnv } from '../../lib/env'

export const APIRoute = createAPIFileRoute('/api/contact')({
  POST: async ({ request }) => {
    // In Cloudflare module workers, Nitro sets globalThis.__env__ = env before dispatching
    // each request (see nitropack cloudflare-module preset: _module-handler.mjs).
    // Fall back to process.env for local dev / Node runtimes.
    const cfEnv = (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).__env__)
      ? (globalThis as Record<string, unknown>).__env__
      : process.env
    const env = validateEnv(cfEnv)

    const rateLimiter = (cfEnv as { RATE_LIMITER?: { limit: (o: { key: string }) => Promise<{ success: boolean }> } } | undefined)?.RATE_LIMITER

    const body = await request.json().catch(() => null)
    if (!body) {
      return Response.json(
        { ok: false, error: { type: 'validation', fields: { form: 'Invalid request body' } } },
        { status: 400 }
      )
    }

    const ip = request.headers.get('cf-connecting-ip') ?? '127.0.0.1'
    const result = await submitContact(body, env, rateLimiter, ip)

    if (!result.ok) {
      const status = result.error.type === 'rate_limited' ? 429
        : result.error.type === 'validation' ? 400 : 500
      return Response.json({ ok: false, error: result.error }, { status })
    }

    return Response.json({ ok: true })
  },
})
