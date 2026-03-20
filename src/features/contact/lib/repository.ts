// src/features/contact/lib/repository.ts
import { Resend } from 'resend'
import type { ContactInput } from './schemas'
import type { Env } from '../../../lib/env'

export async function sendContactEmail(input: ContactInput, env: Env): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY)
  await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    subject: `Contact from ${input.name}`,
    text: `Name: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
    replyTo: input.email,
  })
}
