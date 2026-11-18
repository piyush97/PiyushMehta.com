import React, { useMemo, useState } from 'react';

/**
 * Heuristic TODO triage. The classifier is a simplified version of the regex
 * set the census script in the post uses: it only recognizes GitHub issue URLs,
 * orders the patterns differently and omits the census's `bugword` pattern;
 * the issue state is whatever you, the reader, say
 * it is. Nothing here calls a tracker. The point of the widget is the gap
 * between "the comment exists" and "the comment is resolvable".
 */

const MARKER = /\b(TODO|FIXME|XXX|HACK)\b/;

const URL_RE = /https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+\/issues\/(\d+)/;
const HASH_RE = /(?<![\w&])#(\d{1,7})\b/;
const BUGPATH_RE = /\bbug\/(\d{1,7})\b/i;
const TRACKER_RE = /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/;

type Kind = 'issue-url' | 'hash' | 'bug-path' | 'tracker-key' | 'none';
type State = 'unknown' | 'open' | 'closed' | 'deleted';

const SAMPLE = `// TODO(bug/31204): drop the shim once the IPC rewrite lands
// XXX: workaround libuv implicit LF => CRLF conversion. #10558
pending('FIXME #10804')
# TODO: this is weird.  See #9685 where we have to special-case it
// FIXME: merge compacts overlapping chunks without a limit. Split it.`;

function classify(line: string): { kind: Kind; id: string | null } {
  const url = URL_RE.exec(line);
  if (url) return { kind: 'issue-url', id: `#${url[1]}` };
  const bugPath = BUGPATH_RE.exec(line);
  if (bugPath) return { kind: 'bug-path', id: `bug/${bugPath[1]}` };
  const hash = HASH_RE.exec(line);
  if (hash) return { kind: 'hash', id: `#${hash[1]}` };
  const key = TRACKER_RE.exec(line);
  if (key) return { kind: 'tracker-key', id: key[0] };
  return { kind: 'none', id: null };
}

const VERDICT: Record<string, { label: string; tone: string; why: string }> = {
  none: {
    label: 'invisible',
    tone: 'border-slate-600 text-slate-300',
    why: 'No ticket reference. An agent still reads it as a request; no scanner can price it.',
  },
  unknown: {
    label: 'unresolved',
    tone: 'border-amber-500 text-amber-300',
    why: 'The comment names a ticket. Until something looks the ticket up, you do not know if it is load-bearing.',
  },
  open: {
    label: 'live',
    tone: 'border-emerald-500 text-emerald-300',
    why: 'Ticket is open. Keep the comment, but it is not an instruction: check it against the task.',
  },
  closed: {
    label: 'dead',
    tone: 'border-rose-500 text-rose-300',
    why: 'Ticket is closed. The comment outlived the work it describes. Delete it.',
  },
  deleted: {
    label: 'dangling',
    tone: 'border-fuchsia-500 text-fuchsia-300',
    why: 'Ticket is gone. Every lookup is a wasted tool call that returns nothing.',
  },
};

export default function TodoTriage() {
  const [text, setText] = useState(SAMPLE);
  const [states, setStates] = useState<Record<number, State>>({});

  const rows = useMemo(() => {
    return text
      .split('\n')
      .map((line, i) => ({ line: line.trim(), i }))
      .filter((r) => r.line.length > 0 && MARKER.test(r.line))
      .map((r) => ({ ...r, ...classify(r.line) }));
  }, [text]);

  const resolvable = rows.filter((r) => r.kind !== 'none').length;
  const share = rows.length ? (resolvable / rows.length) * 100 : 0;

  return (
    <div className="not-prose my-8 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <p className="mb-2 font-mono text-xs uppercase tracking-wider text-slate-400">
        todo triage · heuristic classifier, your tracker
      </p>
      <label htmlFor="todo-input" className="mb-1 block text-sm text-slate-300">
        Paste comment lines from a repo:
      </label>
      <textarea
        id="todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        spellCheck={false}
        className="w-full rounded border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
      />

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs text-slate-400">
        <span>
          {rows.length} marker{rows.length === 1 ? '' : 's'}
        </span>
        <span>
          {resolvable} resolvable ({share.toFixed(1)}%)
        </span>
        <span className="text-slate-500">
          census of 14 public repos: 2.7% (simplified classifier; not directly comparable)
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const state: State = row.kind === 'none' ? 'unknown' : (states[row.i] ?? 'unknown');
          const verdict = row.kind === 'none' ? VERDICT.none : VERDICT[state];
          return (
            <li key={row.i} className="rounded border border-slate-800 bg-slate-950/60 p-3">
              <code className="block break-words font-mono text-xs text-slate-300">{row.line}</code>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${verdict.tone}`}
                >
                  {verdict.label}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {row.kind === 'none' ? 'no reference found' : `${row.kind} ${row.id}`}
                </span>
                {row.kind !== 'none' && (
                  <span className="ml-auto flex gap-1">
                    {(['open', 'closed', 'deleted'] as State[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStates((prev) => ({ ...prev, [row.i]: s }))}
                        aria-pressed={state === s}
                        className={`inline-flex min-h-[44px] items-center justify-center rounded border px-3 font-mono text-[11px] ${
                          state === s
                            ? 'border-sky-400 bg-sky-400/10 text-sky-200'
                            : 'border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">{verdict.why}</p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-slate-500">
        Set the ticket state to see the one decision the comment cannot make for you. In the census,
        37 of 56 resolvable references pointed at closed tickets.
      </p>
    </div>
  );
}
