// src/features/contact/lib/schemas.ts
import { z } from 'zod'

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  _hp: z.string().max(0, 'Bot detected'),
})

export type ContactInput = z.infer<typeof ContactSchema>

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.errors.map((e) => [e.path.join('.') || 'form', e.message])
  )
}
