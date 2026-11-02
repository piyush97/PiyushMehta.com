import React, { useMemo, useState } from 'react';

/**
 * Toy model of a shared-cache timing channel, not a measurement.
 * Baseline latencies come from a probe run on one laptop (see article):
 * LLC hit ~15 ns, LLC miss ~111 ns. Everything else is arithmetic so the
 * reader can move the sliders and watch what survives.
 */

const HIT_NS = 15;
const MISS_NS = 111;
const THRESHOLD_NS = (HIT_NS + MISS_NS) / 2;
const PAYLOAD_BITS = 64;

// Published channel rates, bit/s. Log-spaced stops so the slider spans
// five orders of magnitude without becoming unusable.
const RATES = [0.2, 3.2, 215, 746, 751, 5000, 40000, 100000, 362000, 600000];
const RATE_NOTES = [
  'Ristenpart 2009, L2, EC2',
  'cache channel, virtualised, 9% error',
  'Xu 2011, L2 cross-VM',
  'Wu 2012, memory bus, lab',
  'Maurice 2015 (C5), LLC cross-VM',
  'tuned LLC, error correction',
  'multiple cores, known addressing',
  'Wu 2012, memory bus, EC2',
  'Maurice 2017, EC2, 0% error',
  'Liu 2015, LLC, 600 kbit/s',
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return '∞';
  if (seconds < 0.001) return `${(seconds * 1e6).toFixed(0)} µs`;
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 90) return `${seconds.toFixed(1)} s`;
  if (seconds < 5400) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 172800) return `${(seconds / 3600).toFixed(1)} h`;
  if (seconds < 3.15e7) return `${(seconds / 86400).toFixed(1)} days`;
  return `${(seconds / 3.15e7).toFixed(1)} years`;
}

interface Run {
  sent: number[];
  received: number[];
  errors: number;
}

function simulate(jitter: number, samples: number, repetition: number, seed: number): Run {
  const rand = mulberry32(seed);
  const sent: number[] = [];
  for (let i = 0; i < PAYLOAD_BITS; i++) sent.push(rand() < 0.5 ? 0 : 1);

  const encoded: number[] = [];
  for (const bit of sent) for (let r = 0; r < repetition; r++) encoded.push(bit);

  const rawBits: number[] = [];
  const sigma = jitter * (MISS_NS - HIT_NS) * 0.5;

  for (const bit of encoded) {
    const centre = bit === 1 ? MISS_NS : HIT_NS;
    const probes: number[] = [];
    for (let s = 0; s < samples; s++) probes.push(Math.max(1, centre + gaussian(rand) * sigma));
    rawBits.push(median(probes) > THRESHOLD_NS ? 1 : 0);
  }

  const received: number[] = [];
  for (let i = 0; i < rawBits.length; i += repetition) {
    const group = rawBits.slice(i, i + repetition);
    const ones = group.reduce((a, b) => a + b, 0);
    received.push(ones * 2 > repetition ? 1 : 0);
  }

  const errors = received.reduce((acc, bit, i) => acc + (bit === sent[i] ? 0 : 1), 0);
  return { sent, received, errors };
}

const PRESETS = [
  { label: 'Quiet host', rateIndex: 4, jitter: 0.1, samples: 3, repetition: 1 },
  { label: 'Noisy neighbour', rateIndex: 4, jitter: 0.6, samples: 3, repetition: 3 },
  { label: 'Record channel', rateIndex: 8, jitter: 0.35, samples: 5, repetition: 3 },
];
export default function CacheChannelSimulator() {
  const [rateIndex, setRateIndex] = useState(4);
  const [jitter, setJitter] = useState(0.1);
  const [samples, setSamples] = useState(3);
  const [repetition, setRepetition] = useState(1);
  const [seed, setSeed] = useState(7);

  const rate = RATES[rateIndex];
  const run = useMemo(
    () => simulate(jitter, samples, repetition, seed),
    [jitter, samples, repetition, seed],
  );

  const goodput = rate / repetition;
  const ber = run.errors / PAYLOAD_BITS;
  const slotNs = 1e9 / rate;
  const probesFit = samples * MISS_NS < slotNs;
  const keySeconds = 256 / goodput;
  const repoSeconds = (10 * 1024 * 1024 * 8) / goodput;

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        Timing-channel model. Latencies are measured (15&nbsp;ns hit, 111&nbsp;ns miss); the bit
        rate stops are published cross-VM figures; everything else is arithmetic you can break.
      </figcaption>

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setRateIndex(preset.rateIndex);
              setJitter(preset.jitter);
              setSamples(preset.samples);
              setRepetition(preset.repetition);
            }}
            className="inline-flex min-h-11 items-center rounded-md border border-card-border bg-card-bg px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="inline-flex min-h-11 items-center rounded-md border border-accent px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-white"
        >
          New payload
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-text-secondary sm:col-span-2">
          <span className="mb-1 flex flex-wrap justify-between gap-2">
            <span>Channel rate · {RATE_NOTES[rateIndex]}</span>
            <span className="font-mono text-text-primary">
              {rate >= 1000 ? `${(rate / 1000).toFixed(0)} kbit/s` : `${rate} bit/s`}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={RATES.length - 1}
            step={1}
            value={rateIndex}
            onChange={(e) => setRateIndex(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Channel bit rate"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between">
            <span>Timing noise (± % of gap)</span>
            <span className="font-mono text-text-primary">{Math.round(jitter * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={jitter}
            onChange={(e) => setJitter(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Timing noise"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between">
            <span>Samples per bit</span>
            <span className="font-mono text-text-primary">{samples}</span>
          </span>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={samples}
            onChange={(e) => setSamples(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Samples per bit"
          />
        </label>

        <label className="block text-xs text-text-secondary sm:col-span-2">
          <span className="mb-1 flex justify-between">
            <span>Repetition code</span>
            <span className="font-mono text-text-primary">{repetition}×</span>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={2}
            value={repetition}
            onChange={(e) => setRepetition(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Repetition code factor"
          />
        </label>
      </div>

      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
        Decoded payload · red = wrong bit
      </div>
      <div
        className="mb-4 grid grid-cols-8 gap-1 sm:grid-cols-[repeat(16,minmax(0,1fr))]"
        role="img"
        aria-label={`Recovered payload: ${run.errors} of ${PAYLOAD_BITS} bits wrong`}
      >
        {run.received.map((bit, i) => {
          const wrong = bit !== run.sent[i];
          return (
            <div
              key={i}
              className={`flex h-7 items-center justify-center rounded border font-mono text-[11px] ${
                wrong
                  ? 'border-red-400/70 bg-red-500/15 text-red-300'
                  : 'border-card-border bg-card-bg text-text-secondary'
              }`}
            >
              {bit}
            </div>
          );
        })}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">Bit errors</dt>
          <dd className="font-mono text-lg text-text-primary">
            {run.errors}/{PAYLOAD_BITS}
            <span className="ml-1 text-xs text-text-secondary">({(ber * 100).toFixed(1)}%)</span>
          </dd>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">Goodput</dt>
          <dd className="font-mono text-lg text-text-primary">
            {goodput >= 1000 ? `${(goodput / 1000).toFixed(1)}k` : goodput.toFixed(0)}{' '}
            <span className="text-xs text-text-secondary">bit/s</span>
          </dd>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">32-byte key</dt>
          <dd className="font-mono text-lg text-text-primary">{formatDuration(keySeconds)}</dd>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-3">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">10 MB repo</dt>
          <dd className="font-mono text-lg text-text-primary">{formatDuration(repoSeconds)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-text-secondary">
        {probesFit
          ? `Each bit gets ${samples} probe(s) inside a ${slotNs >= 1e6 ? `${(slotNs / 1e6).toFixed(1)} ms` : `${slotNs.toFixed(0)} ns`} slot — the receiver has room.`
          : `At this rate a bit lasts only ${slotNs >= 1e6 ? `${(slotNs / 1e6).toFixed(1)} ms` : `${slotNs.toFixed(0)} ns`}, less than ${samples} probe(s) need. A real receiver drops samples; the error rate above is optimistic.`}{' '}
        Sender and receiver must agree on the slot clock before the first bit, and that agreement
        cannot travel over the channel.
      </p>
    </figure>
  );
}
