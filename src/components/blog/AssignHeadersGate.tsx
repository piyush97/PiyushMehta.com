import React, { useState } from 'react';

/**
 * The guard in front of the vulnerable write in mod_http2's assign_headers(),
 * and the table the write lands in before and after 2.4.71.
 *
 * Conditions and line numbers follow modules/http2/h2_request.c at tag 2.4.70
 * (clone on line 324, guarded write on line 353). The component shows which
 * branch runs and which table is mutated; it does not model the race itself.
 */

type Gate = {
  http2: boolean;
  noBody: boolean;
  contentType: boolean;
  noContentLength: boolean;
};

type Condition = {
  id: keyof Gate;
  label: string;
  code: string;
  detail: string;
};

const CONDITIONS: Condition[] = [
  {
    id: 'http2',
    label: 'HTTP/2 negotiated',
    code: 'Protocols h2|h2c',
    detail: 'h2 or h2c is allowed for this server or virtual host',
  },
  {
    id: 'noBody',
    label: 'Stream carries no body',
    code: 'no_body',
    detail: 'mod_http2 decides no DATA frames will follow',
  },
  {
    id: 'contentType',
    label: 'Content-Type present',
    code: 'apr_table_get(req->headers, "Content-Type")',
    detail: 'the parsed request carries a content type',
  },
  {
    id: 'noContentLength',
    label: 'Content-Length absent',
    code: '!cl',
    detail: 'the request declared no length',
  },
];

export default function AssignHeadersGate() {
  const [gate, setGate] = useState<Gate>({
    http2: true,
    noBody: true,
    contentType: true,
    noContentLength: true,
  });
  const [patched, setPatched] = useState(false);

  const open = gate.http2 && gate.noBody && gate.contentType && gate.noContentLength;

  const writeTarget = patched ? 'clone' : 'shared';

  return (
    <figure className="my-8 rounded-xl border border-card-border bg-surface-100 p-5 sm:p-6">
      <figcaption className="mb-4 text-sm text-text-secondary">
        Four conditions have to hold before <span className="font-mono">assign_headers()</span>{' '}
        writes <span className="font-mono">Content-Length: 0</span>. Turn them off to see which one
        closes the path, and switch builds to see which table the write lands in.
      </figcaption>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-text-secondary">Build</span>
        <button
          type="button"
          aria-pressed={!patched}
          onClick={() => setPatched(false)}
          className={`min-h-11 rounded-md border px-3 py-2 font-mono text-xs transition-colors ${
            !patched
              ? 'border-rose-400/70 text-text-primary'
              : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
          }`}
        >
          2.4.55 – 2.4.70
        </button>
        <button
          type="button"
          aria-pressed={patched}
          onClick={() => setPatched(true)}
          className={`min-h-11 rounded-md border px-3 py-2 font-mono text-xs transition-colors ${
            patched
              ? 'border-emerald-400/70 text-text-primary'
              : 'border-card-border bg-card-bg text-text-secondary hover:border-accent hover:text-text-primary'
          }`}
        >
          2.4.71
        </button>
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-text-secondary">The guard</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {CONDITIONS.map((c) => {
          const on = gate[c.id];
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setGate((g) => ({ ...g, [c.id]: !g[c.id] }))}
              className={`flex min-h-11 flex-col items-start justify-center gap-0.5 rounded-md border px-3 py-2 text-left transition-colors ${
                on
                  ? 'border-accent/60 bg-card-bg text-text-primary'
                  : 'border-card-border bg-transparent text-text-secondary hover:border-card-border-hover'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2 text-xs font-medium">
                <span>{c.label}</span>
                <span
                  className={`font-mono text-[10px] ${on ? 'text-accent' : 'text-text-secondary'}`}
                >
                  {on ? 'ON' : 'OFF'}
                </span>
              </span>
              <span className="font-mono text-[11px] opacity-70">{c.code}</span>
            </button>
          );
        })}
      </div>

      <pre className="mb-4 overflow-x-auto rounded-md border border-card-border bg-[#0b1220] p-3 text-[11px] leading-relaxed text-slate-300 sm:text-xs">
        <code>
          <span className="text-slate-500">
            {'/* runs only when every condition above holds */\n'}
          </span>
          {'if (no_body && !cl && apr_table_get(req->headers, "Content-Type")) {\n  '}
          <span className={open ? 'rounded bg-rose-500/15 px-1 text-rose-200' : 'text-slate-500'}>
            {patched
              ? 'apr_table_setn(r->headers_in, "Content-Length", "0");'
              : 'apr_table_setn(req->headers,   "Content-Length", "0");'}
          </span>
          {'\n}'}
        </code>
      </pre>

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-lg border p-3 transition-colors ${
            open && writeTarget === 'shared'
              ? 'border-rose-400/60 bg-rose-500/5'
              : 'border-card-border bg-card-bg'
          }`}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-mono text-xs text-text-primary">req-&gt;headers</p>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                open && writeTarget === 'shared'
                  ? 'bg-rose-500/20 text-rose-200'
                  : 'bg-surface-200 text-text-secondary'
              }`}
            >
              {open && writeTarget === 'shared' ? 'WRITE' : 'read only'}
            </span>
          </div>
          <p className="mb-2 text-[11px] text-text-secondary">
            parsed request, connection side. Shared by the connection and every stream worker on it.
          </p>
          <ul className="space-y-1 font-mono text-[11px] text-slate-300">
            <li>content-type: text/plain</li>
            <li className={open && writeTarget === 'shared' ? 'text-rose-200' : 'opacity-30'}>
              content-length: 0
            </li>
          </ul>
        </div>

        <div
          className={`rounded-lg border p-3 transition-colors ${
            open && writeTarget === 'clone'
              ? 'border-emerald-400/60 bg-emerald-500/5'
              : 'border-card-border bg-card-bg'
          }`}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-mono text-xs text-text-primary">r-&gt;headers_in</p>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                open && writeTarget === 'clone'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'bg-surface-200 text-text-secondary'
              }`}
            >
              {open && writeTarget === 'clone' ? 'WRITE' : 'read only'}
            </span>
          </div>
          <p className="mb-2 text-[11px] text-text-secondary">
            <span className="font-mono">apr_table_clone(r-&gt;pool, req-&gt;headers)</span>, line
            324. One copy per request, on the request&apos;s own pool.
          </p>
          <ul className="space-y-1 font-mono text-[11px] text-slate-300">
            <li>content-type: text/plain</li>
            <li className={open && writeTarget === 'clone' ? 'text-emerald-200' : 'opacity-30'}>
              content-length: 0
            </li>
          </ul>
        </div>
      </div>

      <p
        role="status"
        className={`mt-4 text-xs ${open && writeTarget === 'shared' ? 'text-rose-300' : 'text-text-secondary'}`}
      >
        {!gate.http2
          ? 'HTTP/1.1 only: assign_headers() is never reached, so this vhost has nothing to patch for this bug.'
          : !open
            ? 'Path closed: this request shape never reaches the write.'
            : patched
              ? 'Path open, but the write lands in the per-request clone. The shared table is only read.'
              : 'Path open: a bodyless request with a content-type mutates the table the connection owns, while sibling stream workers on the same connection are reading it.'}
      </p>

      <p className="mt-3 text-[11px] text-text-secondary">
        The branch order and conditions are from <span className="font-mono">h2_request.c</span> at
        2.4.70. The cell lists are illustrative; a real table carries the whole request.
      </p>
    </figure>
  );
}
