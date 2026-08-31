import { useId, useState } from 'react';

type Status = 'idle' | 'sending' | 'success' | 'error';

interface Props {
  variant?: 'inline' | 'card';
  source?: string;
  className?: string;
}

export default function NewsletterSignup({
  variant = 'inline',
  source = 'website',
  className = '',
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  // Honeypot — bots fill all fields, humans don't see this
  const [website, setWebsite] = useState('');
  const emailId = `newsletter-email-${useId().replace(/:/g, '')}`;

  function validate(): boolean {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That email looks off. Try again?');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (website) return; // honeypot tripped

    setStatus('sending');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string };

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Something went sideways. Try again?');
        setStatus('error');
        return;
      }

      setStatus('success');
      setEmail('');
    } catch {
      setError('Network error. Check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`newsletter-signup__success ${className}`} role="status">
        <p className="newsletter-signup__success-title">You're in. Check your inbox to confirm.</p>
        <p className="newsletter-signup__success-description">
          Didn't see it? Peek at spam, then promote it. Next issue ships soon.
        </p>
      </div>
    );
  }

  const cardStyles = variant === 'card' ? 'newsletter-signup--card' : '';

  return (
    <div className={`newsletter-signup ${cardStyles} ${className}`}>
      <form onSubmit={handleSubmit} noValidate className="newsletter-signup__form">
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'sending'}
          className="newsletter-signup__input"
        />
        {/* Honeypot — hidden from humans, visible to dumb bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden="true"
        />
        <button type="submit" disabled={status === 'sending'} className="newsletter-signup__button">
          {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {error && (
        <p className="newsletter-signup__error" role="alert">
          {error}
        </p>
      )}
      {variant === 'inline' && (
        <p className="newsletter-signup__note">
          Free. One email when there's something worth saying. Unsubscribe anytime.
        </p>
      )}
    </div>
  );
}
