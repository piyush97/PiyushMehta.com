import { useState } from 'react';

type Status = 'idle' | 'sending' | 'success' | 'error';

interface Field {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: Field = { name: '', email: '', subject: '', message: '' };

export default function ContactForm({ className = '' }: { className?: string }) {
  const [fields, setFields] = useState<Field>(EMPTY);
  const [errors, setErrors] = useState<Partial<Field>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');

  function validate(): boolean {
    const e: Partial<Field> = {};
    if (!fields.name.trim()) e.name = 'Required';
    if (!fields.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = 'Invalid email';
    if (!fields.subject.trim()) e.subject = 'Required';
    if (!fields.message.trim()) e.message = 'Required';
    else if (fields.message.trim().length < 10) e.message = 'At least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setServerError(data.error ?? 'Something went wrong.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setFields(EMPTY);
    } catch {
      setServerError('Network error. Check your connection and try again.');
      setStatus('error');
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof Field]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  if (status === 'success') {
    return (
      <div className={`contact-success ${className}`}>
        <div className="contact-success__icon" aria-hidden="true">
          ✓
        </div>
        <h3>Message sent.</h3>
        <p>Got it — I'll get back to you shortly.</p>
        <button type="button" className="contact-success__reset" onClick={() => setStatus('idle')}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`contact-form ${className}`}>
      <div className="contact-form__row">
        <div className="contact-form__field">
          <label htmlFor="cf-name">Name</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={fields.name}
            onChange={handleChange}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'cf-name-err' : undefined}
          />
          {errors.name && (
            <span id="cf-name-err" className="contact-form__error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="contact-form__field">
          <label htmlFor="cf-email">Email</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={fields.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'cf-email-err' : undefined}
          />
          {errors.email && (
            <span id="cf-email-err" className="contact-form__error">
              {errors.email}
            </span>
          )}
        </div>
      </div>

      <div className="contact-form__field">
        <label htmlFor="cf-subject">Subject</label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          placeholder="What's this about?"
          value={fields.subject}
          onChange={handleChange}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'cf-subject-err' : undefined}
        />
        {errors.subject && (
          <span id="cf-subject-err" className="contact-form__error">
            {errors.subject}
          </span>
        )}
      </div>

      <div className="contact-form__field">
        <label htmlFor="cf-message">Message</label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          placeholder="Tell me about the project, constraints, and what good looks like."
          value={fields.message}
          onChange={handleChange}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'cf-message-err' : undefined}
        />
        {errors.message && (
          <span id="cf-message-err" className="contact-form__error">
            {errors.message}
          </span>
        )}
      </div>

      {status === 'error' && (
        <p className="contact-form__server-error" role="alert">
          {serverError}
        </p>
      )}

      <button type="submit" className="contact-form__submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
