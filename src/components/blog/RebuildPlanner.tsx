import React, { useMemo, useState } from 'react';

/**
 * Toy model of a targeted-build planner, not a measurement.
 *
 * The shape follows Cloudflare's DNS zone builder (Nov 2026): an event maps to
 * the smallest set of keys that a full build could change, and anything the
 * planner cannot classify escalates to a full rebuild. Numbers here are
 * arithmetic over the sliders so the reader can watch work and risk move
 * independently.
 */

type EventId = 'update' | 'rename' | 'ttl' | 'ssl' | 'dnssec' | 'unknown';

type Plan = {
  keys: string[];
  reads: number;
  full: boolean;
  stale: string | null;
  reason: string;
};

const METADATA_KEYS = 12;

const EVENTS: { id: EventId; label: string; sub: string }[] = [
  { id: 'update', label: 'A record value', sub: 'www changes from 203.0.113.10 to .11' },
  { id: 'rename', label: 'Record rename', sub: 'old.example A becomes new.example A' },
  { id: 'ttl', label: 'Record TTL', sub: 'same value, new TTL' },
  { id: 'ssl', label: 'Universal SSL', sub: 'metadata plus CAA at the apex' },
  { id: 'dnssec', label: 'DNSSEC setting', sub: 'may touch every name' },
  { id: 'unknown', label: 'Unclassified event', sub: 'producer only bumped a timestamp' },
];

function zoneSizeLabel(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

function pct(x: number) {
  const p = x * 100;
  if (p === 0) return '0%';
  if (p < 0.0001) return '<0.0001%';
  if (p < 0.01) return `${p.toFixed(4)}%`;
  if (p < 1) return `${p.toFixed(2)}%`;
  return `${p.toFixed(0)}%`;
}

export default function RebuildPlanner() {
  const [eventId, setEventId] = useState<EventId>('ssl');
  const [zoneLog, setZoneLog] = useState(7); // 10^7 records
  const [emitOldKey, setEmitOldKey] = useState(true);
  const [failClosed, setFailClosed] = useState(true);
  const [sample, setSample] = useState(20);
  const [releases, setReleases] = useState(12);

  const zone = Math.round(Math.pow(10, zoneLog));

  const plan = useMemo<Plan>(() => {
    const fullReads = zone + METADATA_KEYS;

    switch (eventId) {
      case 'update':
        return {
          keys: ['www.example.com A'],
          reads: 1,
          full: false,
          stale: null,
          reason: 'The event names one key. A full build would write the same single key.',
        };
      case 'rename':
        return emitOldKey
          ? {
              keys: ['new.example.com A', 'old.example.com A (removed)'],
              reads: 2,
              full: false,
              stale: null,
              reason:
                'Two keys: the one created and the one to delete. Deletion is part of the closure.',
            }
          : {
              keys: ['new.example.com A'],
              reads: 1,
              full: false,
              stale: 'old.example.com still resolves to 203.0.113.10',
              reason:
                'Only the new record is emitted, so the old key is never removed. Cheaper by one key, and wrong forever.',
            };
      case 'ttl':
        return {
          keys: ['www.example.com A'],
          reads: 1,
          full: false,
          stale: null,
          reason: 'TTL lives in the same key as the value, so the write set is unchanged.',
        };
      case 'ssl':
        return {
          keys: ['example.com CAA', 'zone metadata'],
          reads: 2,
          full: false,
          stale: null,
          reason:
            'Settings look global and usually are not. Universal SSL changes CAA at the apex plus metadata, nothing else.',
        };
      case 'dnssec':
        return {
          keys: ['every name in the zone', 'zone metadata'],
          reads: fullReads,
          full: true,
          stale: null,
          reason: 'The setting can alter signed output for every name. The closure is the zone.',
        };
      case 'unknown':
      default:
        return failClosed
          ? {
              keys: ['every name in the zone', 'zone metadata'],
              reads: fullReads,
              full: true,
              stale: null,
              reason:
                'The event does not say what changed. Uncertainty is not evidence of a small change, so it pays full price.',
            }
          : {
              keys: ['www.example.com A'],
              reads: 1,
              full: false,
              stale: 'a name nobody rebuilt after a background update',
              reason:
                'Guessing a scope from an unclassified event. The build is fast and the diff is silent.',
            };
    }
  }, [eventId, emitOldKey, failClosed, zone]);

  const share = plan.reads / (zone + METADATA_KEYS);
  const cells = 128;
  const lit = plan.full ? cells : Math.max(1, Math.round(share * cells));

  // Model, not measurement: a sampled mirror only sees a stale key if the zone
  // is sampled AND the two pipelines have not converged by comparison time.
  const perRelease = (sample / 100) * 0.6;
  const cumulative = 1 - Math.pow(1 - perRelease, releases);

  return (
    <figure className="not-prose my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        A planner for one zone. Pick an event, then decide whether the rewrite set is provably equal
        to what a full build would have written.
      </figcaption>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Event to plan">
        {EVENTS.map((e) => {
          const active = e.id === eventId;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setEventId(e.id)}
              aria-pressed={active}
              title={e.sub}
              className={`inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
              }`}
            >
              {e.label}
            </button>
          );
        })}
      </div>

      <p className="mb-5 font-mono text-xs text-text-secondary">
        {EVENTS.find((e) => e.id === eventId)?.sub}
      </p>

      <div className="mb-5">
        <div className="mb-1 flex justify-between">
          <label
            htmlFor="zone-size"
            className="text-xs uppercase tracking-wide text-text-secondary"
          >
            Zone size
          </label>
          <span className="font-mono text-xs text-text-primary">{zoneSizeLabel(zone)} records</span>
        </div>
        <input
          id="zone-size"
          type="range"
          min={3}
          max={8}
          step={1}
          value={zoneLog}
          onChange={(e) => setZoneLog(Number(e.target.value))}
          className="accent-accent w-full"
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border bg-card-bg p-3">
          <input
            type="checkbox"
            checked={emitOldKey}
            onChange={(e) => setEmitOldKey(e.target.checked)}
            className="mt-1 accent-accent"
          />
          <span className="text-xs text-text-secondary">
            <span className="block font-medium text-text-primary">Emit the removed key</span>
            Rename events carry old and new names.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border bg-card-bg p-3">
          <input
            type="checkbox"
            checked={failClosed}
            onChange={(e) => setFailClosed(e.target.checked)}
            className="mt-1 accent-accent"
          />
          <span className="text-xs text-text-secondary">
            <span className="block font-medium text-text-primary">Fail closed on unknown</span>
            Unclassified events rebuild the zone.
          </span>
        </label>
      </div>

      <div className="mb-4 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
        {Array.from({ length: cells }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${
              i < lit ? 'bg-accent' : 'bg-light-700/60 dark:bg-light-800/60'
            }`}
          />
        ))}
      </div>
      <p className="mb-5 text-xs text-text-secondary">
        Filled cells are keys this build must read. One cell is roughly{' '}
        {zoneSizeLabel(zone / cells)} records.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            reads
          </div>
          <div className="font-mono text-lg text-text-primary">{plan.reads.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            full build
          </div>
          <div className="font-mono text-lg text-text-primary">
            {(zone + METADATA_KEYS).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            share of zone
          </div>
          <div className="font-mono text-lg text-text-primary">{pct(share)}</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            verdict
          </div>
          <div
            className={`font-mono text-sm ${
              plan.stale ? 'text-red-400' : plan.full ? 'text-amber-300' : 'text-emerald-400'
            }`}
          >
            {plan.stale ? 'UNSOUND' : plan.full ? 'FULL REBUILD' : 'TARGETED'}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-card-border bg-card-bg p-3">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
          rewrite set
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.keys.map((k) => (
            <span
              key={k}
              className="rounded border border-card-border px-2 py-1 font-mono text-[11px] text-text-primary"
            >
              {k}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-secondary">{plan.reason}</p>
      </div>

      {plan.stale && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-red-300">
            stale key: {plan.stale}
          </div>
          <p className="mb-4 text-xs text-text-secondary">
            No error, no failed request, no alert. The old answer keeps being served until something
            else touches that key. This is the class of bug a mirror test can only sample.
          </p>

          <div className="mb-1 flex justify-between">
            <label htmlFor="sample" className="text-xs uppercase tracking-wide text-text-secondary">
              Mirror sample
            </label>
            <span className="font-mono text-xs text-text-primary">{sample}% of zones</span>
          </div>
          <input
            id="sample"
            type="range"
            min={5}
            max={100}
            step={5}
            value={sample}
            onChange={(e) => setSample(Number(e.target.value))}
            className="accent-accent mb-3 w-full"
          />

          <div className="mb-1 flex justify-between">
            <label
              htmlFor="releases"
              className="text-xs uppercase tracking-wide text-text-secondary"
            >
              Releases compared
            </label>
            <span className="font-mono text-xs text-text-primary">{releases}</span>
          </div>
          <input
            id="releases"
            type="range"
            min={1}
            max={60}
            step={1}
            value={releases}
            onChange={(e) => setReleases(Number(e.target.value))}
            className="accent-accent mb-3 w-full"
          />

          <div className="h-2 w-full overflow-hidden rounded-full bg-light-800/60">
            <div
              className="h-full rounded-full bg-red-400 transition-[width] duration-300"
              style={{ width: `${Math.round(cumulative * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            Chance the mirror catches it across {releases} releases:{' '}
            <span className="font-mono text-text-primary">{(cumulative * 100).toFixed(0)}%</span>.
            Per release it is {sample}% sampled times an assumed 60% chance the two pipelines still
            disagree when the comparer looks. Sampling is a smoke detector, not a proof.
          </p>
        </div>
      )}

      {!plan.stale && plan.full && (
        <p className="rounded-lg border border-card-border bg-card-bg p-3 text-xs text-text-secondary">
          Correct and expensive. The planner is allowed to say this: a rebuild you cannot shrink
          without an argument is a rebuild you should not shrink.
        </p>
      )}

      {!plan.stale && !plan.full && (
        <p className="rounded-lg border border-card-border bg-card-bg p-3 text-xs text-text-secondary">
          Correct only if the rewrite set equals what a full build would write for this event. That
          is the claim you have to test, and it is why the mirror builder exists.
        </p>
      )}
    </figure>
  );
}
