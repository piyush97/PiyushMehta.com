// src/features/contact/components/ContactForm.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrors({})
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json() as { ok: boolean; error?: { type: string; fields?: Record<string, string> } }
    if (json.ok) {
      setStatus('success');
      (e.target as HTMLFormElement).reset()
    } else if (json.error?.type === 'validation') {
      setErrors(json.error.fields ?? {})
      setStatus('idle')
    } else {
      setStatus('error')
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot field — hidden from real users, visible to bots */}
      <input type="text" name="_hp" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-field">
        <label htmlFor="name" className="form-label">Name</label>
        <input id="name" name="name" type="text" required className="form-input" />
        {errors.name && <p className="form-error" role="alert">{errors.name}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="email" className="form-label">Email</label>
        <input id="email" name="email" type="email" required className="form-input" />
        {errors.email && <p className="form-error" role="alert">{errors.email}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="message" className="form-label">Message</label>
        <textarea id="message" name="message" required rows={6} className="form-input form-textarea" />
        {errors.message && <p className="form-error" role="alert">{errors.message}</p>}
      </div>
      <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending\u2026' : 'Send message'}
      </button>
      {status === 'success' && <p className="form-success" role="status">Message sent! I'll get back to you soon.</p>}
      {status === 'error' && <p className="form-error" role="alert">Something went wrong. Please try again.</p>}
    </form>
  )
}
