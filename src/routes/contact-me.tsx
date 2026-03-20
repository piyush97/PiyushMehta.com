// src/routes/contact-me.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ContactForm } from '../features/contact/components/ContactForm'

export const Route = createFileRoute('/contact-me')({
  head: () => ({ meta: [{ title: 'Contact — Piyush Mehta' }] }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <div className="container-base">
      <h1>Get in touch</h1>
      <ContactForm />
    </div>
  )
}
