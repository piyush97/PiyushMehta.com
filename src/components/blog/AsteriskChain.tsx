import React, { useMemo, useState } from 'react';

/**
 * Model of the sshd password compare, calibrated against measurements of the
 * real libc calls (see the article). The libc boundary is measured on musl
 * 1.2 (alpine:3.22) and glibc (debian:bookworm); everything else here is the
 * compare logic copied from auth-passwd.c, so the reader can turn one
 * precondition off at a time and watch the verdict flip.
 */

type Libc = 'musl' | 'glibc';
type Stored = 'star' | 'bang' | 'real';

interface State {
  libc: Libc;
  pam: boolean;
  passwordAuth: boolean;
  stored: Stored;
  donor: boolean;
  length: number;
  patched: boolean;
}

const PRESETS: { name: string; state: State }[] = [
  {
    name: 'Alpine default, 2026',
    state: {
      libc: 'musl',
      pam: false,
      passwordAuth: true,
      stored: 'star',
      donor: true,
      length: 257,
      patched: false,
    },
  },
  {
    name: 'Alpine + 10.6p2',
    state: {
      libc: 'musl',
      pam: false,
      passwordAuth: true,
      stored: 'star',
      donor: true,
      length: 257,
      patched: true,
    },
  },
  {
    name: 'Debian / glibc',
    state: {
      libc: 'glibc',
      pam: true,
      passwordAuth: true,
      stored: 'star',
      donor: true,
      length: 257,
      patched: false,
    },
  },
];

const STORED_LABEL: Record<Stored, string> = {
  star: '*  (no password)',
  bang: '!  (locked)',
  real: '$6$abc$ZE4Pk3…  (real)',
};

const STORED_VALUE: Record<Stored, string> = {
  star: '*',
  bang: '!',
  real: '$6$abc$ZE4Pk3kxdvXasbkMczcXYY.xL/yjSvafp4EosxKhMrtLYoy9BXWLMrRcsct2IgJaDwFFoeY5qS0JqbkIYFMiM0',
};

function evaluate(s: State): { accepted: boolean; steps: { text: string; ok: boolean | null }[] } {
  const stored = STORED_VALUE[s.stored];
  const steps: { text: string; ok: boolean | null }[] = [];

  steps.push({
    text: `field="${stored.slice(0, 12)}${stored.length > 12 ? '…' : ''}" (${stored.length} B)`,
    ok: null,
  });

  if (!s.passwordAuth) {
    steps.push({
      text: 'PasswordAuthentication no → the attempt is refused before any hash',
      ok: false,
    });
    return { accepted: false, steps };
  }

  if (s.pam) {
    if (s.stored !== 'real') {
      steps.push({
        text: 'PAM on → the stack refuses a locked field without calling crypt()',
        ok: false,
      });
      return { accepted: false, steps };
    }
    steps.push({ text: 'PAM on → go through the PAM stack, not this compare', ok: false });
    return { accepted: false, steps };
  }

  if (s.length > 1024) {
    steps.push({
      text: `password ${s.length} B > MAX_PASSWORD_LEN 1024 → sshd drops the attempt`,
      ok: false,
    });
    return { accepted: false, steps };
  }

  // Salt selection: a field too short to hold a salt borrows one (pick_salt).
  let salt: string;
  if (stored.length >= 2) {
    salt = stored.slice(0, stored.lastIndexOf('$') + 1) || 'xx';
    steps.push({ text: `salt: the account's own setting ${salt}`, ok: null });
  } else if (s.donor) {
    salt = '$6$abc$';
    steps.push({ text: 'salt: field too short → borrow $6$abc$ from another account', ok: null });
  } else {
    salt = 'xx';
    steps.push({ text: 'no salt donor on the box → falls back to "xx" (DES)', ok: null });
  }

  // The libc boundary, calibrated from the probe: musl rejects keys > 256 bytes
  // for $5$/$6$ and signals it by returning the string "*".
  const sha2 = salt.startsWith('$5$') || salt.startsWith('$6$');
  let shown: string;
  let equal = false;
  if (sha2 && s.libc === 'musl' && s.length > 256) {
    shown = '*';
    equal = stored === '*';
    steps.push({ text: `crypt(${s.length} B, ${salt}) → "*"  (musl KEY_MAX 256)`, ok: null });
  } else if (sha2) {
    shown = `${salt}9Qk…`;
    steps.push({ text: `crypt(${s.length} B, ${salt}) → a 93-byte hash of the attempt`, ok: null });
  } else {
    shown = 'abJnggxhB/yWI';
    steps.push({ text: `crypt(${s.length} B, "xx") → DES hash`, ok: null });
  }

  const lengthRule = !s.patched || stored.length >= 4;
  if (s.patched && !lengthRule) {
    steps.push({
      text: `patched: stored field is ${stored.length} B < MIN_PASSWORD_HASH_LEN 4 → refuse`,
      ok: false,
    });
  }

  steps.push({
    text: `compare "${shown}" with the field → ${equal ? 'equal' : 'not equal'}`,
    ok: equal,
  });

  return { accepted: equal && lengthRule, steps };
}

function Toggle({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-xs uppercase tracking-wider text-text-secondary mb-1">{label}</legend>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`min-h-11 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                on
                  ? 'border-sky-400 bg-sky-400/10 text-text-primary'
                  : 'border-card-border text-text-secondary hover:border-slate-400'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1 text-[11px] leading-snug text-text-secondary">{hint}</p>}
    </fieldset>
  );
}

export default function AsteriskChain() {
  const [s, setS] = useState<State>(PRESETS[0].state);
  const { accepted, steps } = useMemo(() => evaluate(s), [s]);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((prev) => ({ ...prev, [k]: v }));
  const activePreset = PRESETS.find((p) => JSON.stringify(p.state) === JSON.stringify(s))?.name;

  return (
    <div className="bg-gradient-card border border-card-border rounded-lg my-8 p-4 sm:p-6 shadow-card min-w-0 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-text-primary">Would this login succeed?</h3>
        <span className="font-mono text-[11px] text-text-secondary">model, not sshd</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {PRESETS.map((p) => {
          const on = p.name === activePreset;
          return (
            <button
              key={p.name}
              type="button"
              aria-pressed={on}
              onClick={() => setS(p.state)}
              className={`min-h-11 rounded-full border px-2.5 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                on
                  ? 'border-sky-400 bg-sky-400/10 text-text-primary font-semibold'
                  : 'border-card-border text-text-secondary hover:border-sky-400 hover:text-text-primary'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <Toggle
          label="libc"
          options={[
            { value: 'musl', label: 'musl' },
            { value: 'glibc', label: 'glibc' },
          ]}
          value={s.libc}
          onChange={(v) => set('libc', v as Libc)}
        />
        <Toggle
          label="PAM for sshd"
          options={[
            { value: 'off', label: 'off' },
            { value: 'on', label: 'on' },
          ]}
          value={s.pam ? 'on' : 'off'}
          onChange={(v) => set('pam', v === 'on')}
        />
        <Toggle
          label="PasswordAuthentication"
          options={[
            { value: 'yes', label: 'yes' },
            { value: 'no', label: 'no' },
          ]}
          value={s.passwordAuth ? 'yes' : 'no'}
          onChange={(v) => set('passwordAuth', v === 'yes')}
        />
        <Toggle
          label="target's shadow field"
          options={[
            { value: 'star', label: '*' },
            { value: 'bang', label: '!' },
            { value: 'real', label: '$6$…' },
          ]}
          value={s.stored}
          onChange={(v) => set('stored', v as Stored)}
        />
        <Toggle
          label="salt donor on the box"
          options={[
            { value: 'yes', label: 'exists' },
            { value: 'no', label: 'none' },
          ]}
          value={s.donor ? 'yes' : 'no'}
          onChange={(v) => set('donor', v === 'yes')}
        />
        <Toggle
          label="OpenSSH"
          options={[
            { value: 'old', label: '< 10.6p2' },
            { value: 'new', label: '10.6p2' },
          ]}
          value={s.patched ? 'new' : 'old'}
          onChange={(v) => set('patched', v === 'new')}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="pwlen"
          className="flex items-baseline justify-between text-xs text-text-secondary"
        >
          <span className="uppercase tracking-wider">password length</span>
          <span className="font-mono text-text-primary">{s.length} B</span>
        </label>
        <input
          id="pwlen"
          type="range"
          min={1}
          max={1100}
          step={1}
          value={s.length}
          onChange={(e) => set('length', Number(e.target.value))}
          className="w-full mt-1 h-11 accent-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        />
        <p className="font-mono text-[10px] leading-snug text-text-secondary">
          limits: 256 B for musl, 1024 B for sshd
        </p>
      </div>

      <div
        className={`mt-4 rounded-md border p-3 font-mono text-xs ${
          accepted ? 'border-rose-500/60 bg-rose-500/5' : 'border-card-border bg-black/10'
        }`}
      >
        <p
          aria-live="polite"
          className={accepted ? 'text-rose-300 font-bold' : 'text-text-primary font-bold'}
        >
          {accepted ? 'BYPASS — login accepted, no password needed' : 'rejected'}
        </p>
        <ul className="mt-2 space-y-1 text-text-secondary">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-1.5">
              <span
                aria-hidden="true"
                className={
                  step.ok === true
                    ? 'text-rose-300'
                    : step.ok === false
                      ? 'text-emerald-300'
                      : 'text-slate-500'
                }
              >
                {step.ok === true ? '=' : step.ok === false ? '×' : '›'}
              </span>
              <span className="min-w-0 break-words">{step.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[11px] leading-snug text-text-secondary">
        {STORED_LABEL[s.stored]} on {s.libc}
        {s.pam ? ' with PAM' : ' without PAM'}. Hash and salt values are fixed placeholders; the
        256-byte boundary and the <code className="font-mono">"*"</code> vs{' '}
        <code className="font-mono">"*0"</code> return values are the measured libc behaviour
        described in the article.
      </p>
    </div>
  );
}
