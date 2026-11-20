import React, { useMemo, useState } from 'react';

/**
 * Ledger of behaviors a test suite can assert, with the status each one has
 * against AWS Emulator v1.0.544. Statuses are not opinions: `verified` and
 * `partial` come from per-call match counts in that release's scores.json.gz,
 * `silent` comes from the AWS launch post and docs (IAM not evaluated, single
 * account, no throttling/eventual consistency) or from the published service
 * score (CloudFormation 26.7%).
 */

type Status = 'verified' | 'partial' | 'silent';

type Row = {
  id: string;
  behavior: string;
  status: Status;
  evidence: string;
  defaultOn: boolean;
};

const ROWS: Row[] = [
  {
    id: 'ddb-put-get',
    behavior: 'DynamoDB PutItem / GetItem roundtrip',
    status: 'verified',
    evidence: '954/974 · 1,003/1,036 calls matched',
    defaultOn: true,
  },
  {
    id: 's3-crud',
    behavior: 'S3 object CRUD and listing',
    status: 'verified',
    evidence: '232/232 put · 198/198 delete matched',
    defaultOn: true,
  },
  {
    id: 's3-semantics',
    behavior: 'S3 metadata casing, delete markers',
    status: 'verified',
    evidence: 'Matches AWS, unlike hand-written mocks',
    defaultOn: false,
  },
  {
    id: 'ddb-creating',
    behavior: 'New table not writable until ACTIVE',
    status: 'verified',
    evidence: 'About 3 s in CREATING, then ResourceNotFound',
    defaultOn: false,
  },
  {
    id: 'lambda',
    behavior: 'Lambda Invoke and error payloads',
    status: 'partial',
    evidence: '45/47 calls matched',
    defaultOn: false,
  },
  {
    id: 'ddb-expressions',
    behavior: 'DynamoDB Query and Update expressions',
    status: 'partial',
    evidence: '470/525 query · 308/351 update matched',
    defaultOn: false,
  },
  {
    id: 'iam',
    behavior: 'IAM policy denies the wrong principal',
    status: 'silent',
    evidence: 'Policies not evaluated the way AWS does',
    defaultOn: true,
  },
  {
    id: 'cdk',
    behavior: 'CDK or CloudFormation deploy',
    status: 'silent',
    evidence: '26.7% service · DescribeType 2/2,033',
    defaultOn: true,
  },
  {
    id: 'timing',
    behavior: 'Throttling, quotas, consistency',
    status: 'silent',
    evidence: 'Not simulated, so retries go untested',
    defaultOn: false,
  },
  {
    id: 'cross-account',
    behavior: 'Cross-account or cross-Region access',
    status: 'silent',
    evidence: 'Single account, no cross-Region behavior',
    defaultOn: false,
  },
];

const STATUS_META: Record<Status, { label: string; dot: string; tone: string }> = {
  verified: { label: 'backed', dot: 'bg-emerald-400', tone: 'text-emerald-300' },
  partial: { label: 'partial', dot: 'bg-amber-400', tone: 'text-amber-300' },
  silent: { label: 'either way', dot: 'bg-rose-400', tone: 'text-rose-300' },
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function AwsEmulatorLedger() {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ROWS.map((r) => [r.id, r.defaultOn])),
  );

  const checked = useMemo(() => ROWS.filter((r) => on[r.id]), [on]);
  const count = (s: Status) => checked.filter((r) => r.status === s).length;
  const verified = count('verified');
  const partial = count('partial');
  const silent = count('silent');
  const total = checked.length;

  const toggle = (id: string) => setOn((prev) => ({ ...prev, [id]: !prev[id] }));

  const verdict = (() => {
    if (total === 0) return 'Tick the behaviors your suite asserts.';
    if (silent === 0 && partial === 0)
      return `All ${total} assertions are backed by measured AWS behavior. Green means something here.`;
    if (silent === 0)
      return `${plural(partial, 'assertion is')} only partly backed. Green means something for the other ${verified}, and is a guess for the rest.`;
    return `${silent} of ${total} assertions pass in both worlds. A green run is evidence for ${verified} of them and evidence of nothing for the other ${total - verified}.`;
  })();

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-4 sm:p-6">
      <figcaption className="mb-3 text-sm text-text-secondary">
        Fidelity is per behavior, not per repository. Tick what your test cycle asserts: the ledger
        splits green checks into evidence and noise. Statuses describe the emulator at v1.0.544,
        from its score file and the AWS launch post.
      </figcaption>

      <ul className="mb-4 space-y-0.5">
        {ROWS.map((row) => {
          const meta = STATUS_META[row.status];
          const isOn = on[row.id];
          return (
            <li key={row.id}>
              <label
                className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
                  isOn ? 'bg-card-bg' : 'bg-transparent hover:bg-card-bg/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(row.id)}
                  className="accent-accent mt-0.5 h-5 w-5 shrink-0"
                  aria-label={row.behavior}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug text-text-primary">
                    {row.behavior}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] leading-snug">
                    <span className={`inline-flex items-center gap-1 ${meta.tone}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                      {meta.label}
                    </span>
                    <span className="text-text-secondary">{row.evidence}</span>
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-card-border bg-card-bg p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Evidence in your run
          </p>
          <p className="font-mono text-sm text-text-primary">
            {verified}/{total || 0} backed
          </p>
        </div>

        <div
          className="mt-2.5 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-surface-200"
          role="img"
          aria-label={`${verified} backed, ${partial} partly backed, ${silent} green either way`}
        >
          {verified > 0 && <div className="h-full bg-emerald-400" style={{ flexGrow: verified }} />}
          {partial > 0 && <div className="h-full bg-amber-400" style={{ flexGrow: partial }} />}
          {silent > 0 && <div className="h-full bg-rose-400" style={{ flexGrow: silent }} />}
        </div>

        <p className="mt-2.5 text-sm leading-snug text-text-secondary" aria-live="polite">
          {verdict}
        </p>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {(
            [
              ['Backed', verified, 'text-emerald-300'],
              ['Partial', partial, 'text-amber-300'],
              ['Either way', silent, 'text-rose-300'],
            ] as Array<[string, number, string]>
          ).map(([label, value, tone]) => (
            <div key={label} className="rounded-md border border-card-border px-2 py-1">
              <dt className="text-[10px] uppercase tracking-wide text-text-secondary">{label}</dt>
              <dd className={`font-mono text-base ${tone}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}
