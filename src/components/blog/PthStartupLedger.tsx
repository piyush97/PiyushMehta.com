import React, { useMemo, useState } from 'react';

/**
 * Interpreter-startup ledger. Every flag in this widget was run against a
 * throwaway venv with a planted `hook.pth`; the "measured" numbers in the post
 * come from the same setup. The model reproduces site.py's documented phase
 * order: user site .pth -> environment .pth -> .start -> sitecustomize ->
 * usercustomize -> __main__. Nothing here executes anything.
 */

type FlagKey = 'noSite' | 'isolated' | 'noUserSite' | 'ignoreEnv' | 'userHook' | 'startFile';

const FLAGS: { key: FlagKey; label: string; detail: string; measured: boolean }[] = [
  {
    key: 'noSite',
    label: '-S',
    detail:
      'Skips the site module entirely, so no .pth or .start file is read. It also removes site-packages from sys.path, which is why nobody runs it in production.',
    measured: true,
  },
  {
    key: 'isolated',
    label: '-I',
    detail:
      'Ignores PYTHON* env vars, drops the script directory and the user site. It still imports site, so the environment .pth files run. Measured: the hook fired.',
    measured: true,
  },
  {
    key: 'noUserSite',
    label: '-s',
    detail:
      'Disables the user site only. A hook installed into a venv is untouched. Measured: the hook fired.',
    measured: true,
  },
  {
    key: 'ignoreEnv',
    label: '-E',
    detail:
      'Ignores PYTHON* environment variables. .pth processing is not controlled by an environment variable, so this changes nothing. Measured: the hook fired.',
    measured: true,
  },
  {
    key: 'userHook',
    label: 'hook in ~/.local',
    detail:
      'The same wheel installed with --user writes its .pth into the user site, which site.py processes before your venv. This is the only case -s and -I actually block.',
    measured: true,
  },
  {
    key: 'startFile',
    label: 'matching .start',
    detail:
      'Python 3.15 and later ignore import lines in a .pth when a .start file shares its basename. The hook does not disappear; it moves into a pkg.mod:callable entry point.',
    measured: false,
  },
];

type Status = 'ran' | 'skipped' | 'moved';

const TONE: Record<Status, string> = {
  ran: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
  skipped: 'border-slate-700 bg-slate-900/60 text-slate-500',
  moved: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
};

export default function PthStartupLedger() {
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    noSite: false,
    isolated: false,
    noUserSite: false,
    ignoreEnv: false,
    userHook: false,
    startFile: false,
  });

  const toggle = (k: FlagKey) => setFlags((prev) => ({ ...prev, [k]: !prev[k] }));

  const s = useMemo(() => {
    const siteRuns = !flags.noSite;
    const userSite = siteRuns && !flags.noUserSite && !flags.isolated;
    const venue: 'venv' | 'user' = flags.userHook ? 'user' : 'venv';
    const startRuns = siteRuns && flags.startFile;
    const hookFires = siteRuns && (venue === 'venv' || userSite);
    const channel = !hookFires
      ? venue === 'user'
        ? 'none: the hook is in the user site, which -s or -I disabled'
        : 'none: the interpreter never reached site.py'
      : startRuns
        ? 'zz_probe:run() from zz_probe.start; the .pth import line is ignored'
        : venue === 'user'
          ? 'import zz_probe_hook from ~/.local/lib/pythonX.Y/site-packages/zz_probe.pth'
          : 'import zz_probe_hook from site-packages/zz_probe.pth';
    return { siteRuns, userSite, venue, startRuns, hookFires, channel };
  }, [flags]);

  const rows: { phase: string; call: string; status: Status; note: string }[] = [
    {
      phase: '1',
      call: 'site.main()',
      status: s.siteRuns ? 'ran' : 'skipped',
      note: s.siteRuns
        ? 'with -S the whole chain below never starts'
        : 'sys.flags.no_site set, so nothing else here happens',
    },
    {
      phase: '2',
      call: 'addusersitepackages()',
      status: !s.siteRuns ? 'skipped' : s.userSite ? 'ran' : 'skipped',
      note:
        s.venue === 'user' && s.hookFires
          ? 'user site ~/.local: hook fires'
          : s.venue === 'user'
            ? 'hook is here, but the user site is disabled'
            : s.userSite
              ? 'user site ~/.local, scanned, no hook'
              : 'user site disabled by -s or -I',
    },
    {
      phase: '3',
      call: 'addsitepackages()',
      status: !s.siteRuns ? 'skipped' : s.venue === 'venv' && flags.startFile ? 'moved' : 'ran',
      note:
        s.venue === 'venv'
          ? 'venv site-packages: exec(line) for import lines'
          : 'venv site-packages, scanned, no hook',
    },
    {
      phase: '4',
      call: '.start entry points',
      status: s.startRuns ? 'ran' : 'skipped',
      note: s.startRuns ? 'pkg.mod:callable resolved with strict=True' : 'no .start file shipped',
    },
    {
      phase: '5',
      call: 'sitecustomize',
      status: s.siteRuns ? 'ran' : 'skipped',
      note: 'a second, equally silent injection point',
    },
    {
      phase: '6',
      call: 'usercustomize',
      status: s.userSite ? 'ran' : 'skipped',
      note: 'only when ENABLE_USER_SITE is true',
    },
    {
      phase: '7',
      call: 'your first line',
      status: 'ran',
      note: 'everything above already executed',
    },
  ];

  return (
    <div className="not-prose my-8 rounded-lg border border-slate-800 bg-slate-950/60 p-4 font-mono text-xs text-slate-300 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        interpreter startup ledger
      </p>
      <p className="mt-2 font-sans text-sm text-slate-400">
        Toggle what you would add to the command line (or to the environment) and watch which phase
        reaches the hook first.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FLAGS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => toggle(f.key)}
            aria-pressed={flags[f.key]}
            className={`inline-flex min-h-[44px] items-center rounded border px-3 text-[11px] ${
              flags[f.key]
                ? 'border-sky-400 bg-sky-400/10 text-sky-200'
                : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mt-3 font-sans text-xs leading-relaxed text-slate-400">
        {FLAGS.filter((f) => flags[f.key])
          .map((f) => f.detail)
          .join(' ') || 'Nothing selected: the plain interpreter start.'}
      </p>

      <ol className="mt-4 space-y-1.5 tabular-nums">
        {rows.map((r) => (
          <li
            key={r.phase}
            className="grid grid-cols-[1.25rem_1fr_auto] items-baseline gap-x-2 gap-y-1 border-b border-slate-800/60 pb-1.5"
          >
            <span className="text-slate-400">{r.phase}</span>
            <span className="break-words text-slate-200">{r.call}</span>
            <span
              className={`justify-self-end rounded border px-1.5 py-0.5 text-[10px] uppercase ${TONE[r.status]}`}
            >
              {r.status}
            </span>
            <span className="col-start-2 col-end-4 text-[11px] text-slate-400">{r.note}</span>
          </li>
        ))}
      </ol>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className={`rounded border p-3 ${s.hookFires ? TONE.ran : TONE.skipped}`}>
          <dt className="text-[10px] uppercase tracking-wide opacity-70">credential stealer</dt>
          <dd className="mt-1 text-sm">{s.hookFires ? 'runs' : 'does not run'}</dd>
          <dd className="mt-1 break-words text-[10px] opacity-80">{s.channel}</dd>
        </div>
        <div
          className={`rounded border p-3 ${
            s.siteRuns ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : TONE.ran
          }`}
        >
          <dt className="text-[10px] uppercase tracking-wide opacity-70">third-party imports</dt>
          <dd className="mt-1 text-sm">
            {s.siteRuns ? 'work' : "ModuleNotFoundError: No module named 'dummypkg'"}
          </dd>
          <dd className="mt-1 text-[10px] opacity-80">
            {s.siteRuns ? 'site-packages still on sys.path' : 'measured with -S in a venv'}
          </dd>
        </div>
      </dl>

      <p className="mt-3 font-sans text-xs leading-relaxed text-slate-400">
        Two flags are the whole story: <code className="text-slate-200">-I</code> reads like
        isolation and does not touch this code path, and <code className="text-slate-200">-S</code>{' '}
        does stop it by breaking the environment you were trying to protect.
      </p>
      <p className="mt-2 font-sans text-[11px] leading-relaxed text-slate-400">
        Every flag above was run against a venv with a planted hook; the{' '}
        <code className="text-slate-200">.start</code> rule comes from the 3.15 docs and PEP 829.
        The widget is a model of <code className="text-slate-200">site.py</code>, not a Python
        runtime.
      </p>
    </div>
  );
}
