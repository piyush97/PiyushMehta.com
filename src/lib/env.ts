// src/lib/env.ts
// Cloudflare Workers do NOT use process.env.
// Env vars are passed as the `env` object in the fetch handler.
// In TanStack Start's Cloudflare adapter, access via: (context as any).cloudflare.env
import { z } from 'zod'

const EnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_FROM_EMAIL: z.string().email(),
  CONTACT_TO_EMAIL: z.string().email(),
  GITHUB_TOKEN: z.string().min(1),
  SENTRY_DSN: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

// Throws ZodError if any required variable is missing — fail fast at request time
export function validateEnv(rawEnv: unknown): Env {
  return EnvSchema.parse(rawEnv)
}
