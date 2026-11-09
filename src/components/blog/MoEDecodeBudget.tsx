import React, { useMemo, useState } from 'react';

/**
 * Arithmetic model of Mixture-of-Experts decode, calibrated against two
 * published measurements:
 *   - llama-modchip / DeepSeek-V4-Flash: 56.56 GiB at 1.71 bpw, 9.06-14.69 tok/s
 *     on a 16-core Zen 5 with 64 GB DDR5-5600 (dual channel, 89.6 GB/s peak).
 *   - llama.cpp quantize README: Llama-3.1-8B IQ1_S 79.73 tok/s vs Q8_0 50.93 tok/s.
 * Nothing here is a benchmark. It is the two equations from the article, so you
 * can move the preconditions and watch which one breaks first.
 */

const GIB = 1024 ** 3;
const DDR5_5600_PEAK = 89.6; // GB/s, dual channel: 5600 MT/s * 8 B * 2

type Preset = {
  label: string;
  note: string;
  totalB: number;
  activeB: number;
  bpw: number;
  ramGiB: number;
  bwGBs: number;
};

const PRESETS: Preset[] = [
  {
    label: 'DeepSeek-V4-Flash · 64 GB desktop',
    note: 'measured 9.06–14.69 tok/s, 1.71 bpw file',
    totalB: 284.33,
    activeB: 13.17,
    bpw: 1.71,
    ramGiB: 64,
    bwGBs: 34,
  },
  {
    label: 'Nemotron 30B-A3B · 32 GB mini-PC',
    note: 'measured 25.0–60.4 tok/s, 3.75 bpw file',
    totalB: 30.2,
    activeB: 3.0,
    bpw: 3.75,
    ramGiB: 32,
    bwGBs: 70,
  },
  {
    label: 'Same 284B model at Q4_K',
    note: 'what four bits would cost in RAM',
    totalB: 284.33,
    activeB: 13.17,
    bpw: 4.5,
    ramGiB: 64,
    bwGBs: 34,
  },
];

function weightsGiB(totalB: number, bpw: number) {
  return (totalB * 1e9 * (bpw / 8)) / GIB;
}

function bytesPerTokenGB(activeB: number, bpw: number) {
  return (activeB * 1e9 * (bpw / 8)) / 1e9;
}

export default function MoEDecodeBudget() {
  const [totalB, setTotalB] = useState(284.33);
  const [activeB, setActiveB] = useState(13.17);
  const [bpw, setBpw] = useState(1.71);
  const [ramGiB, setRamGiB] = useState(64);
  const [bwGBs, setBwGBs] = useState(34);

  const weights = weightsGiB(totalB, bpw);
  const perToken = bytesPerTokenGB(activeB, bpw);
  const usableRam = ramGiB * 0.92; // firmware, page cache, KV headroom
  const fits = weights < usableRam;
  const decode = perToken > 0 ? bwGBs / perToken : 0;
  const denseDecode = bwGBs / bytesPerTokenGB(totalB, bpw);
  const moeFactor = activeB > 0 ? totalB / activeB : 0;
  const atFourBits = weightsGiB(totalB, 4.5);
  const usedPct = (weights / Math.max(usableRam, 1)) * 100;
  const fill = Math.min(100, usedPct);

  const presets = useMemo(
    () =>
      PRESETS.map((p) => ({
        ...p,
        weights: weightsGiB(p.totalB, p.bpw),
        decode: p.bwGBs / bytesPerTokenGB(p.activeB, p.bpw),
      })),
    [],
  );

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        Two-equation model: capacity is total parameters times bits per weight, decode speed is
        memory bandwidth divided by the bytes one token has to read. Measured points are labelled;
        everything else is arithmetic you can contradict.
      </figcaption>

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setTotalB(preset.totalB);
              setActiveB(preset.activeB);
              setBpw(preset.bpw);
              setRamGiB(preset.ramGiB);
              setBwGBs(preset.bwGBs);
            }}
            className="inline-flex min-h-11 items-center rounded-md border border-card-border bg-card-bg px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Total parameters</span>
            <span className="font-mono text-text-primary">{totalB.toFixed(0)}B</span>
          </span>
          <input
            type="range"
            min={8}
            max={800}
            step={1}
            value={totalB}
            onChange={(e) => setTotalB(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Total parameters in billions"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Active parameters per token</span>
            <span className="font-mono text-text-primary">{activeB.toFixed(1)}B</span>
          </span>
          <input
            type="range"
            min={1}
            max={Math.min(totalB, 80)}
            step={0.1}
            value={Math.min(activeB, Math.min(totalB, 80))}
            onChange={(e) => setActiveB(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Active parameters in billions per token"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>Bits per weight (file average)</span>
            <span className="font-mono text-text-primary">{bpw.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={1.5}
            max={16}
            step={0.05}
            value={bpw}
            onChange={(e) => setBpw(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Bits per weight"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          <span className="mb-1 flex justify-between gap-2">
            <span>System RAM</span>
            <span className="font-mono text-text-primary">{ramGiB} GiB</span>
          </span>
          <input
            type="range"
            min={16}
            max={512}
            step={16}
            value={ramGiB}
            onChange={(e) => setRamGiB(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="System RAM in gibibytes"
          />
        </label>

        <label className="block text-xs text-text-secondary sm:col-span-2">
          <span className="mb-1 flex justify-between gap-2">
            <span>Effective memory bandwidth (peak here is {DDR5_5600_PEAK} GB/s)</span>
            <span className="font-mono text-text-primary">{bwGBs.toFixed(0)} GB/s</span>
          </span>
          <input
            type="range"
            min={10}
            max={4000}
            step={10}
            value={bwGBs}
            onChange={(e) => setBwGBs(Number(e.target.value))}
            className="accent-accent w-full"
            aria-label="Effective memory bandwidth in gigabytes per second"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Capacity</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{weights.toFixed(1)} GiB</p>
          <p className="mt-1 text-xs text-text-secondary">
            of {usableRam.toFixed(0)} GiB usable, {fills(usedPct)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-200">
            <div
              className={fits ? 'h-full bg-emerald-400' : 'h-full bg-rose-500'}
              style={{ width: `${fill}%` }}
            />
          </div>
          <p className={fits ? 'mt-2 text-xs text-text-secondary' : 'mt-2 text-xs text-rose-400'}>
            {fits
              ? `Fits with ${(usableRam - weights).toFixed(1)} GiB left for KV cache.`
              : `Does not fit. Short by ${(weights - usableRam).toFixed(1)} GiB.`}
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Decode ceiling</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">
            {decode > 0 && Number.isFinite(decode) ? decode.toFixed(1) : '0'} tok/s
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {perToken.toFixed(2)} GB streamed per token, {moeFactor.toFixed(0)}× less than dense
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            Same weights read densely: {denseDecode.toFixed(2)} tok/s. Never reached, which is the
            point.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-text-secondary">
        At Q4_K (4.5 bpw) this model would need {atFourBits.toFixed(0)} GiB of weights.{' '}
        {bpw < 3
          ? 'Below 3 bits the published evals show 5–20% task loss, and 2-bit multimodal models collapse outright.'
          : 'Above 4 bits the quality argument mostly disappears and the RAM argument starts.'}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Published configurations and their implied throughput
          </caption>
          <thead className="text-text-secondary">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">
                Published setup
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Weights
              </th>
              <th scope="col" className="py-2 font-medium">
                Model tok/s
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-text-primary">
            {presets.map((p) => (
              <tr key={p.label} className="border-t border-card-border">
                <th scope="row" className="py-2 pr-3 font-sans font-normal text-text-secondary">
                  {p.label}
                  <span className="block text-[11px]">{p.note}</span>
                </th>
                <td className="py-2 pr-3">{p.weights.toFixed(1)} GiB</td>
                <td className="py-2">{p.decode.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

function fills(pct: number) {
  if (pct < 100) return 'comfortably';
  if (pct < 110) return 'right at the edge';
  return 'over budget';
}
