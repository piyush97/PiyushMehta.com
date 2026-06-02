import { useState } from 'react';

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
      <div
        className={`rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 ${className}`}
        role="status"
      >
        <p className="font-semibold">You're in. Check your inbox to confirm.</p>
        <p className="mt-1 text-sm opacity-90">
          Didn't see it? Peek at spam, then promote it. Next issue ships soon.
        </p>
      </div>
    );
  }

  const cardStyles =
    variant === 'card'
      ? 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'
      : '';

  return (
    <div className={`${cardStyles} ${className}`}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'sending'}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {variant === 'inline' && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Free. One email when there's something worth saying. Unsubscribe anytime.
        </p>
      )}
    </div>
  );
}
