import React, { useMemo, useState } from 'react';

/**
 * Failure-tax ledger for agent trajectories.
 *
 * Costs are normalised so one *passing* run costs 1.0, because the published
 * data gives ratios and dollars but not per-run token splits. The defaults are
 * calibrated against FrontierHarness Eval v1.1 (27,280 trials, 22 harness
 * configurations x 5 open-weight models):
 *
 *   - pass rate 57.7%: the mean of the 22 configurations in the results table.
 *   - failing-run length 2.47x: solved from the published claim that 64.5% of
 *     list-price spend went to trials that did not pass. Equal-length runs at
 *     that pass rate would put 42.3% of spend on failures; 64.5% needs 2.47x.
 *   - pass rates on the preset buttons are the table's measured values.
 *
 * The model is one line of arithmetic: every step re-sends the context, so a
 * failing run that keeps flailing keeps paying. It is not a benchmark.
 */

type Preset = { id: string; label: string; passRate: number; note: string };

const PRESETS: Preset[] = [
  { id: 'fleet', label: 'All 22 configs', passRate: 0.5765, note: 'mean, 27,280 trials' },
  { id: 'zcode', label: 'ZCode', passRate: 0.619, note: 'highest pass rate, $1.06' },
  { id: 'codex', label: 'Codex CLI', passRate: 0.611, note: '$0.937 per pass' },
  { id: 'claude', label: 'Claude Code', passRate: 0.589, note: '$1.55 per pass' },
  { id: 'mini', label: 'mini-SWE-agent', passRate: 0.586, note: '38 steps per pass' },
  { id: 'exo', label: 'Exo', passRate: 0.506, note: 'lowest pass rate' },
];

const MEASURED_SHARE = 0.645;

function shareOfSpend(passRate: number, failMultiple: number, abortAt: number) {
  const failCost = (1 - passRate) * failMultiple * abortAt;
  const passCost = passRate;
  return failCost / (passCost + failCost);
}

function spendIndex(passRate: number, failMultiple: number, abortAt: number) {
  const now = passRate + (1 - passRate) * failMultiple * abortAt;
  const base = passRate + (1 - passRate) * failMultiple;
  return now / base;
}

export default function StepLedger() {
  const [presetId, setPresetId] = useState('fleet');
  const [failMultiple, setFailMultiple] = useState(2.47);
  const [abortAt, setAbortAt] = useState(1);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const passRate = preset.passRate;

  const share = shareOfSpend(passRate, failMultiple, abortAt);
  const index = spendIndex(passRate, failMultiple, abortAt);
  const equalShare = 1 - passRate;
  const costPerPass = (passRate + (1 - passRate) * failMultiple * abortAt) / passRate;

  const calibration = useMemo(() => {
    // What failing-run length the published 64.5% implies at this pass rate.
    const implied = (MEASURED_SHARE * passRate) / ((1 - MEASURED_SHARE) * (1 - passRate));
    return implied;
  }, [passRate]);

  const saved = 1 - index;
  const savingText =
    saved < 0.005
      ? 'No spend avoided yet'
      : `${(saved * 100).toFixed(0)}% of spend avoided at the same pass rate`;

  const failPct = Math.max(2, share * 100);
  const passPct = 100 - failPct;

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        One passing run costs 1.0. A failing run costs{' '}
        <span className="font-mono text-text-primary">{failMultiple.toFixed(2)}×</span> that, unless
        it is stopped at{' '}
        <span className="font-mono text-text-primary">{(abortAt * 100).toFixed(0)}%</span> of its
        length. Every step re-sends the context, so length is the multiplier, not the prompt size.
        Defaults are calibrated to the published 64.5% failure share.
      </figcaption>

      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-text-secondary">
          Measured pass rate
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === presetId}
              onClick={() => setPresetId(p.id)}
              className={`inline-flex min-h-11 flex-col items-start justify-center rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                p.id === presetId
                  ? 'border-accent text-text-primary'
                  : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
              }`}
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-[11px] opacity-70">
                {(p.passRate * 100).toFixed(1)}% · {p.note}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Failing run vs passing run</span>
            <span className="font-mono text-text-primary">{failMultiple.toFixed(2)}×</span>
          </span>
          <input
            type="range"
            min={1}
            max={3.5}
            step={0.01}
            value={failMultiple}
            onChange={(e) => setFailMultiple(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Cost of a failing run relative to a passing run"
          />
          <span className="mt-1 block text-[11px] opacity-70">
            1.00× means failures are as cheap as successes
          </span>
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Stop failing runs at</span>
            <span className="font-mono text-text-primary">{(abortAt * 100).toFixed(0)}%</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={abortAt}
            onChange={(e) => setAbortAt(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Fraction of a failing run's length completed before a checkpoint stops it"
          />
          <span className="mt-1 block text-[11px] opacity-70">
            100% is today: no checkpoint, no abort
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Spend on non-passing runs
          </p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{(share * 100).toFixed(1)}%</p>
          <p className="mt-1 text-xs text-text-secondary">
            {(equalShare * 100).toFixed(1)}% if failures cost the same as passes
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Cost per pass</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{costPerPass.toFixed(2)}×</p>
          <p className="mt-1 text-xs text-text-secondary">one successful run costs 1.00×</p>
        </div>

        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Spend vs today</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{(index * 100).toFixed(0)}%</p>
          <p className="mt-1 text-xs text-text-secondary">same tasks, same pass rate</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] text-text-secondary">
          <span>passing runs {passPct.toFixed(0)}%</span>
          <span>non-passing runs {failPct.toFixed(0)}%</span>
        </div>
        <div
          className="flex h-3 overflow-hidden rounded-full bg-surface-200"
          role="img"
          aria-label={`Spend split: ${passPct.toFixed(0)} percent on passing runs, ${failPct.toFixed(0)} percent on runs that do not pass`}
        >
          <div className="h-full bg-sky-400" style={{ width: `${passPct}%` }} />
          <div className="h-full bg-amber-400" style={{ width: `${failPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-text-secondary" role="status">
          {savingText}. The published 64.5% implies failing runs last{' '}
          <span className="font-mono">{calibration.toFixed(2)}×</span> a passing run at{' '}
          {(passRate * 100).toFixed(1)}% pass rate.
        </p>
      </div>

      <p className="mt-4 text-xs text-text-secondary">
        Model, not measurement: ratios of run cost, ignoring per-step price differences between
        cached and uncached input. The 64.5% share and every pass rate in the buttons are published
        values; the implied length multiple is solved from them.
      </p>
    </figure>
  );
}
