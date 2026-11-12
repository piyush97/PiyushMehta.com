import React, { useMemo, useState } from 'react';

/**
 * Restore-versus-recompute model for a prefix that fell out of GPU memory.
 *
 * Every input is a published measurement, not a datasheet:
 *   - bytes/token: Red Hat OpenShift AI 3.5 block sizes (5.00 MB / 16 tokens for
 *     Llama 3.1 70B FP8), Lightbits 7.08 GB per 100K tokens for gpt-oss-120B,
 *     Mooncake 48,672 B/token for GLM-5.3 FP8.
 *   - tier bandwidth: 16 concurrent 5 MB jobs divided by the p50 latency in Red
 *     Hat's FIO table, which reproduces their stated 762 MB/s block ceiling.
 *     The RDMA figure is the Lightbits 4.8M-token reload: 234 GB in 15.39 s.
 *   - prefill rate: user-controlled, because it varies by model and hardware
 *     from 837 tok/s (Nemotron-253B, H100) to ~14,000 tok/s (8x B200, Llama-4).
 *
 * The model ignores queueing and attention's quadratic term. It is the two
 * lines of arithmetic from the article so the sign of the decision can be
 * checked, not a benchmark.
 */

type Model = {
  id: string;
  label: string;
  bytesPerToken: number;
  note: string;
};

type Tier = {
  id: string;
  label: string;
  mbPerSecond: number;
  tailRatio: number;
  note: string;
};

const MODELS: Model[] = [
  {
    id: 'glm',
    label: 'GLM-5.3 FP8',
    bytesPerToken: 48672,
    note: '48.7 KB/token, measured',
  },
  {
    id: 'oss',
    label: 'gpt-oss-120B',
    bytesPerToken: 70800,
    note: '7.08 GB per 100K tokens',
  },
  {
    id: 'qwen8',
    label: 'Qwen3-8B',
    bytesPerToken: 140625,
    note: '2.25 MB per 16-token block',
  },
  {
    id: 'llama70',
    label: 'Llama 3.1 70B FP8',
    bytesPerToken: 312500,
    note: '5.00 MB per 16-token block',
  },
];

const TIERS: Tier[] = [
  {
    id: 'rdma',
    label: 'NVMe cluster, RDMA',
    mbPerSecond: 15200,
    tailRatio: 1,
    note: '15.2 GB/s end to end, at 4.8M tokens',
  },
  {
    id: 'nvme',
    label: 'Local NVMe',
    mbPerSecond: 6612,
    tailRatio: 14.1 / 12.1,
    note: '16 jobs × 5 MB / 12.1 ms p50',
  },
  {
    id: 'block',
    label: 'Network block',
    mbPerSecond: 755,
    tailRatio: 109 / 106,
    note: '762 MB/s measured ceiling',
  },
  {
    id: 'object',
    label: 'Object store',
    mbPerSecond: 383,
    tailRatio: 1133 / 209,
    note: 'p50 209 ms, p99 1,133 ms',
  },
  {
    id: 'cephfs',
    label: 'Shared CephFS',
    mbPerSecond: 204,
    tailRatio: 451 / 392,
    note: '205 MB/s protocol ceiling',
  },
];

const GIB = 1024 ** 3;

function fmtSeconds(s: number) {
  if (!Number.isFinite(s) || s <= 0) return '0 s';
  if (s < 1) return `${(s * 1000).toFixed(0)} ms`;
  if (s < 10) return `${s.toFixed(2)} s`;
  return `${s.toFixed(1)} s`;
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

export default function KvRestoreBudget() {
  const [modelId, setModelId] = useState('glm');
  const [tierId, setTierId] = useState('nvme');
  const [logTokens, setLogTokens] = useState(17); // ~131K
  const [prefillRate, setPrefillRate] = useState(3000);
  const [kvBudgetGiB, setKvBudgetGiB] = useState(70);

  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[1];

  const tokens = Math.round(2 ** logTokens);
  const kvGiB = (tokens * model.bytesPerToken) / GIB;
  const kvGB = (tokens * model.bytesPerToken) / 1e9;

  const restore = kvGB / (tier.mbPerSecond / 1000);
  const restoreTail = restore * tier.tailRatio;
  const recompute = tokens / Math.max(prefillRate, 1);
  const ratio = restore / Math.max(recompute, 0.001);
  const restoreWins = restore < recompute;
  const sessions = kvGiB > 0 ? Math.floor(kvBudgetGiB / kvGiB) : 0;
  const thresholdKiB = (tier.mbPerSecond * 1e6) / Math.max(prefillRate, 1) / 1024;

  const maxBar = Math.max(restore, recompute, 0.001);
  const restorePct = Math.max(2, (restore / maxBar) * 100);
  const recomputePct = Math.max(2, (recompute / maxBar) * 100);

  const verdict = useMemo(() => {
    if (Math.abs(1 - ratio) < 0.02) return 'Restore and recompute cost about the same';
    if (restoreWins) return `Restore is ${(1 / ratio).toFixed(1)}× cheaper than recompute`;
    return `Recompute is ${ratio.toFixed(1)}× cheaper than restore`;
  }, [ratio, restoreWins]);

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        Restore a prefix from a cheaper tier, or prefill it again. Compare{' '}
        <span className="font-mono text-text-primary">bytes/token ÷ bandwidth</span> against{' '}
        <span className="font-mono text-text-primary">1 ÷ prefill rate</span>. Measured inputs are
        labelled; queueing and attention's quadratic term are not modelled.
      </figcaption>

      <div className="mb-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-text-secondary">Model</p>
        <div className="flex flex-wrap gap-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === modelId}
              onClick={() => setModelId(m.id)}
              className={`inline-flex min-h-11 flex-col items-start justify-center rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                m.id === modelId
                  ? 'border-accent text-text-primary'
                  : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className="text-[11px] opacity-70">{m.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-text-secondary">
          Where the cache goes
        </p>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === tierId}
              onClick={() => setTierId(t.id)}
              className={`inline-flex min-h-11 flex-col items-start justify-center rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                t.id === tierId
                  ? 'border-accent text-text-primary'
                  : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
              }`}
            >
              <span className="font-medium">{t.label}</span>
              <span className="text-[11px] opacity-70">{t.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Context to restore</span>
            <span className="font-mono text-text-primary">{fmtTokens(tokens)}</span>
          </span>
          <input
            type="range"
            min={12}
            max={20}
            step={0.05}
            value={logTokens}
            onChange={(e) => setLogTokens(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Context length to restore, logarithmic in tokens"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Prefill rate</span>
            <span className="font-mono text-text-primary">
              {prefillRate.toLocaleString()} tok/s
            </span>
          </span>
          <input
            type="range"
            min={200}
            max={15000}
            step={100}
            value={prefillRate}
            onChange={(e) => setPrefillRate(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Prefill throughput in tokens per second"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>HBM budget for KV</span>
            <span className="font-mono text-text-primary">{kvBudgetGiB} GiB</span>
          </span>
          <input
            type="range"
            min={16}
            max={640}
            step={8}
            value={kvBudgetGiB}
            onChange={(e) => setKvBudgetGiB(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="GPU memory budget for KV cache in gibibytes"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Cache size</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{kvGiB.toFixed(1)} GiB</p>
          <p className="mt-1 text-xs text-text-secondary">
            {sessions === 0
              ? `No session fits in ${kvBudgetGiB} GiB`
              : `${sessions} session${sessions === 1 ? '' : 's'} fit${sessions === 1 ? 's' : ''} in ${kvBudgetGiB} GiB`}
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Restore</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{fmtSeconds(restore)}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {fmtSeconds(restoreTail)} at the tier's p99 ratio ({tier.tailRatio.toFixed(1)}×)
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Recompute</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{fmtSeconds(recompute)}</p>
          <p className="mt-1 text-xs text-text-secondary">
            GPU-seconds spent re-running the prefix
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-text-secondary">
            <span>Restore {fmtSeconds(restore)}</span>
            <span>Recompute {fmtSeconds(recompute)}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-200">
            <div
              className="h-full bg-sky-400"
              style={{ width: `${restorePct}%` }}
              aria-hidden="true"
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: `${recomputePct}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
        <p
          className={restoreWins ? 'text-xs text-sky-300' : 'text-xs text-amber-300'}
          role="status"
        >
          {verdict}. Tiers win while bytes/token stays under{' '}
          <span className="font-mono">{thresholdKiB.toFixed(0)} KiB</span> at this prefill rate.
        </p>
      </div>

      <p className="mt-4 text-xs text-text-secondary">
        Bandwidths are derived from the Red Hat FIO table and the Lightbits 4.8M-token reload. Raise
        the prefill rate and watch CephFS lose; raise bytes per token and watch the object store
        follow. The p99 line applies the published tail ratio to the p50 time.
      </p>
    </figure>
  );
}
