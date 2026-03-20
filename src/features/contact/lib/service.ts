// src/features/contact/lib/service.ts
import { ContactSchema, flattenZodErrors } from './schemas'
import { sendContactEmail } from './repository'
import { ok, err } from '../../../lib/result'
import { validationError, rateLimitedError, internalError } from '../../../lib/errors'
import type { Result } from '../../../lib/result'
import type { Env } from '../../../lib/env'

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export async function submitContact(
  input: unknown,
  env: Env,
  rateLimiter: RateLimiter | undefined,
  clientIp: string
): Promise<Result<void>> {
  // 1. Rate limit (skip if binding not available, e.g. local dev)
  if (rateLimiter) {
    const limit = await rateLimiter.limit({ key: clientIp })
    if (!limit.success) return err(rateLimitedError(60))
  }

  // 2. Validate
  const parsed = ContactSchema.safeParse(input)
  if (!parsed.success) return err(validationError(flattenZodErrors(parsed.error)))

  // 3. Honeypot — silently succeed (don't reveal detection to bots)
  if (parsed.data._hp) return ok(undefined)

  // 4. Send
  try {
    await sendContactEmail(parsed.data, env)
    return ok(undefined)
  } catch {
    return err(internalError())
  }
}
