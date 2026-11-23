import React, { useMemo, useState } from 'react';

/**
 * Attribution model for prompt-leak probes.
 *
 * The leak trail is a fixed, constructed scenario that mirrors the shape of the
 * Dragos findings: one marketplace seller exports logs at its own hop, and the
 * model is additionally served from an undisclosed upstream that fetches URLs
 * found in the prompt. Two of the four leaks happen one hop further out than
 * the provider you chose.
 *
 * Nothing here is a measurement. The component models the inference you are
 * allowed to make from each probe design, which is the part teams get wrong.
 */

type Verdict = 'yes' | 'partial' | 'no';

type Design = {
  id: string;
  label: string;
  cost: string;
  answers: Verdict[];
  summary: string;
};

const QUESTIONS = [
  'Did anything leak?',
  'Which request leaked?',
  'Which hop read it?',
  'Which operator and client?',
];

const DESIGNS: Design[] = [
  {
    id: 'shared',
    label: 'One shared canary',
    cost: '1 token in every request',
    answers: ['yes', 'no', 'no', 'no'],
    summary:
      'The token fires, and every hit is the same string. You learn that at least one request was read, and nothing about which one or where.',
  },
  {
    id: 'perRequest',
    label: 'Unique canary per request',
    cost: '1 token per request, tied to its route',
    answers: ['yes', 'yes', 'partial', 'no'],
    summary:
      'Each firing maps back to exactly one request, and you recorded which route carried it. On this trail that blames the provider you picked for all four leaks, though two of them happened at the upstream behind it.',
  },
  {
    id: 'traced',
    label: 'Per-request canary + route trace',
    cost: '1 token per request, image URL, malformed probe',
    answers: ['yes', 'yes', 'yes', 'yes'],
    summary:
      'The image URL gives each hop a client fingerprint, and the nested error envelopes name the hops. The four leaks separate into two at your provider and two at an upstream your provider never disclosed.',
  },
];

const LEAKS = [
  { prompt: 'p1', hop: 'provider', surface: 'log export' },
  { prompt: 'p2', hop: 'provider', surface: 'log export' },
  { prompt: 'p3', hop: 'upstream', surface: 'URL fetch' },
  { prompt: 'p4', hop: 'upstream', surface: 'URL fetch' },
];

const BADGE: Record<Verdict, { label: string; className: string }> = {
  yes: { label: 'yes', className: 'border-emerald-500/40 text-emerald-300' },
  partial: { label: 'partly', className: 'border-amber-500/40 text-amber-300' },
  no: { label: 'no', className: 'border-rose-500/40 text-rose-300' },
};

function trailFor(designId: string) {
  if (designId === 'shared') {
    return LEAKS.map((l) => ({
      ...l,
      observed: 'the same token, again',
      attributable: 'nothing: one string, four unknowns',
    }));
  }
  if (designId === 'perRequest') {
    return LEAKS.map((l) => ({
      ...l,
      observed: `canary ${l.prompt} fired`,
      attributable: `the provider you pinned (${l.prompt} took its route)`,
    }));
  }
  return LEAKS.map((l) => ({
    ...l,
    observed:
      l.hop === 'upstream'
        ? `canary ${l.prompt} + image fetch from a new ASN`
        : `canary ${l.prompt} in an export`,
    attributable: l.hop === 'upstream' ? 'the undisclosed upstream' : 'your provider',
  }));
}

export default function CanaryAttributionLab() {
  const [designId, setDesignId] = useState('perRequest');

  const design = DESIGNS.find((d) => d.id === designId) ?? DESIGNS[1];
  const trail = useMemo(() => trailFor(design.id), [design.id]);
  const hits = trail.length;

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        A canary answers only as many questions as the probe design can carry. Pick a design and
        read the same four leaks through it. The trail is a constructed model of the attribution
        logic, not a measurement.
      </figcaption>

      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-text-secondary">Probe design</p>
        <div className="flex flex-col gap-2">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={d.id === designId}
              onClick={() => setDesignId(d.id)}
              className={`inline-flex min-h-11 flex-col items-start justify-center rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                d.id === designId
                  ? 'border-accent text-text-primary'
                  : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
              }`}
            >
              <span className="font-medium">{d.label}</span>
              <span className="text-[11px] opacity-70">{d.cost}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-card-border bg-card-bg p-4">
        <p className="text-xs uppercase tracking-wide text-text-secondary">The route</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-text-primary">
          <span>your app</span>
          <span className="text-text-secondary">→</span>
          <span className="rounded border border-card-border px-1.5 py-0.5">gateway</span>
          <span className="text-text-secondary">→</span>
          <span className="rounded border border-amber-500/40 px-1.5 py-0.5">
            provider A (logs)
          </span>
          <span className="text-text-secondary">→</span>
          <span className="rounded border border-rose-500/40 px-1.5 py-0.5">
            upstream (undisclosed)
          </span>
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Four of six prompts took this route. Two leaks land at provider A, two at the upstream
          behind it. Two control prompts took an honest route and never fired.
        </p>
      </div>

      <div className="mb-4 overflow-hidden rounded-lg border border-card-border">
        <div className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-card-border bg-card-bg px-3 py-2 text-[11px] uppercase tracking-wide text-text-secondary">
          <span>req</span>
          <span>what you can defend</span>
        </div>
        {trail.map((row) => (
          <div
            key={row.prompt}
            className="grid grid-cols-[2.5rem_1fr] items-start gap-x-3 border-b border-card-border px-3 py-2 last:border-b-0"
          >
            <span className="font-mono text-xs text-text-primary">{row.prompt}</span>
            <span className="text-xs text-text-secondary">
              <span className="block text-text-primary">{row.observed}</span>
              <span className="block">{row.attributable}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4 space-y-2">
        {QUESTIONS.map((q, i) => {
          const verdict = design.answers[i];
          const badge = BADGE[verdict];
          return (
            <div
              key={q}
              className="flex flex-wrap items-center gap-2 rounded-md border border-card-border bg-card-bg px-3 py-2"
            >
              <span
                className={`inline-flex min-w-12 justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-text-primary">{q}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-secondary" role="status">
        <span className="text-text-primary">{hits} firings</span>, each carrying{' '}
        {design.id === 'shared'
          ? 'the same identity every time'
          : `one of ${hits} request identities`}
        . {design.summary}
      </p>

      <p className="mt-3 text-xs text-text-secondary">
        Cost of the design sits on the left, scope of the conclusion on the right. A hit proves use,
        never retention, and never the absence of a leak elsewhere.
      </p>
    </figure>
  );
}
