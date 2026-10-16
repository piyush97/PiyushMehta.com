import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChatTrace, ChatUIMessage } from '../../utils/chat/pipeline';
import Answer from './Answer';
import { useAskPiyush } from './useAskPiyush';

const MAX = 500;
const SUGGESTIONS = [
  'What does Piyush do at Tundra?',
  'Tell me about FocusTube',
  'What has Piyush written about AI agents?',
  'How can I contact Piyush?',
];

interface Source {
  url: string;
  title?: string;
}

const Arrow = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const Stop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);
const Tick = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

function errorCopy(error: Error): string {
  const status = (error as { statusCode?: number }).statusCode;
  if (status === 429)
    return 'Too many questions in a short time, or today’s free capacity is used up. Try again in a bit.';
  if (status === 401 || status === 403) return 'Your session expired. Send the message again.';
  if (status === 503)
    return 'Ask Piyush is offline right now. The contact page still reaches Piyush directly.';
  return 'Something went wrong on my side. Your question was not answered; try again.';
}

const SCOPE_LABEL: Record<ChatTrace['scope'], string> = {
  meta: 'Greeting',
  classifier: 'Classifier: about Piyush',
  unavailable: 'Model unavailable',
};

const STATE_TEXT = {
  done: 'done',
  active: 'in progress',
  idle: 'not run',
  blocked: 'blocked',
} as const;

function partsOf(m: ChatUIMessage) {
  const text = m.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join('');
  const sources = m.parts.filter((p) => p.type === 'source-url') as unknown as Source[];
  const trace = (m.parts.find((p) => p.type === 'data-trace') as { data?: ChatTrace } | undefined)
    ?.data;
  return { text, sources, trace };
}

/** One row of the evidence panel. `state` reflects what the pipeline has actually reported. */
function Step({
  state,
  label,
  detail,
}: {
  state: 'done' | 'active' | 'idle' | 'blocked';
  label: string;
  detail?: string;
}) {
  return (
    <li className={`ask-step ask-step--${state}`}>
      <span className="ask-step__mark" aria-hidden="true">
        {state === 'done' && <Tick />}
      </span>
      <span className="ask-step__label">
        {label}
        <span className="sr-only">: {STATE_TEXT[state]}</span>
      </span>
      {detail && <span className="ask-step__detail">{detail}</span>}
    </li>
  );
}

export default function AskPiyush({ siteKey }: { siteKey: string }) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
    regenerate,
    setMessages,
    turnstileHost,
    verifyError,
    historyError,
  } = useAskPiyush(siteKey);
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  const busy = status === 'submitted' || status === 'streaming';
  // `busy` comes from the last render; a ref blocks a second Enter in the same tick.
  const inFlight = useRef(false);

  const answers = useMemo(() => messages.filter((m) => m.role === 'assistant'), [messages]);
  const active = answers.find((m) => m.id === picked) ?? answers.at(-1);
  const activeParts = active ? partsOf(active) : undefined;
  const activeIsLive = busy && active?.id === answers.at(-1)?.id;
  const waiting = busy && messages.at(-1)?.role === 'user';

  // Doorways link here as /ask?q=...; fill the box but never send, so a link cannot spend quota.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (!q) return;
    setInput(q.slice(0, MAX));
    inputRef.current?.focus({ preventScroll: true });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom || status === 'submitted') el.scrollTo({ top: el.scrollHeight });
  }, [messages, status]);

  function submit(text: string) {
    const q = text.trim();
    if (!q || busy || inFlight.current || q.length > MAX) return;
    inFlight.current = true;
    setInput('');
    setPicked(null);
    void sendMessage({ text: q }).finally(() => {
      inFlight.current = false;
    });
    inputRef.current?.focus({ preventScroll: true });
  }

  const t = activeParts?.trace;
  const refused = t?.verdict === 'refused';
  const answeredNow = t?.verdict === 'answered';

  return (
    <section className="ask" aria-label="Ask Piyush">
      <div className="ask__main">
        <div
          ref={logRef}
          className="ask__log"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          tabIndex={0}
        >
          {messages.length === 0 && (
            <div className="ask__empty">
              <h2>What would you like to know?</h2>
              <p>
                Every answer is built from pages on this site and links the page it came from.
                Anything about Piyush is fair game.
              </p>
              <ul className="ask__prompts">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => submit(s)} disabled={busy}>
                      <span>{s}</span>
                      <Arrow />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m) => {
            const { text, sources, trace } = partsOf(m);
            if (m.role === 'user') {
              return (
                <article key={m.id} className="ask__q" aria-label="You asked">
                  <p>{text}</p>
                </article>
              );
            }
            if (!text && sources.length === 0) return null;
            const isActive = active?.id === m.id;
            return (
              <article
                key={m.id}
                className={`ask__a${isActive ? ' is-active' : ''}`}
                aria-label="Answer"
              >
                <Answer text={text} />
                {trace && (
                  <p className="ask__trace">
                    <span>{SCOPE_LABEL[trace.scope]}</span>
                    {trace.sources > 0 && (
                      <span>
                        {trace.sources} {trace.sources === 1 ? 'source' : 'sources'}
                      </span>
                    )}
                    {trace.provider && <span>{trace.provider}</span>}
                    {trace.guard && <span>guard {trace.guard}</span>}
                  </p>
                )}
                {sources.length > 0 && (
                  <ul className="ask__inline-sources" aria-label="Sources">
                    {sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url}>{s.title ?? s.url}</a>
                      </li>
                    ))}
                  </ul>
                )}
                {!isActive && (
                  <button
                    type="button"
                    className="ask__inspect"
                    aria-label={`Show evidence for answer ${answers.indexOf(m) + 1}`}
                    onClick={() => setPicked(m.id)}
                  >
                    Show evidence
                  </button>
                )}
              </article>
            );
          })}

          {waiting && (
            <div className="ask__a ask__thinking" role="status">
              <span className="ask__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="sr-only">Ask Piyush is thinking</span>
            </div>
          )}

          {(error || verifyError) && (
            <div className="ask__error" role="alert">
              <p>{verifyError || (error ? errorCopy(error) : '')}</p>
              {!verifyError && (
                <button type="button" onClick={() => void regenerate()}>
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {historyError && (
          <p className="ask__hint" role="status">
            {historyError}
          </p>
        )}

        <form
          className="ask__composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <label htmlFor="ask-input" className="sr-only">
            Your question about Piyush
          </label>
          <textarea
            id="ask-input"
            ref={inputRef}
            value={input}
            rows={2}
            maxLength={MAX}
            placeholder="Ask about Piyush’s work…"
            aria-describedby={hintId}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit(input);
              }
            }}
          />
          <div className="ask__bar">
            <p id={hintId} className="ask__hint">
              Answers only about Piyush, one question at a time. AI can be wrong; check the sources.
              <span className="ask__count" aria-hidden="true">
                {input.length}/{MAX}
              </span>
            </p>
            <div className="ask__buttons">
              {messages.length > 0 && !busy && (
                <button
                  type="button"
                  className="ask__ghost"
                  onClick={() => {
                    setMessages([]);
                    clearError();
                    setPicked(null);
                    setInput('');
                    inputRef.current?.focus({ preventScroll: true });
                  }}
                >
                  New chat
                </button>
              )}
              {busy ? (
                <button
                  type="button"
                  className="ask__send"
                  onClick={() => void stop()}
                  aria-label="Stop generating"
                >
                  <Stop />
                  <span>Stop</span>
                </button>
              ) : (
                <button type="submit" className="ask__send" disabled={!input.trim()}>
                  <span>Ask</span>
                  <Arrow />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <aside className="ask__rail" aria-label="Evidence for the selected answer">
        <h2>Evidence</h2>
        {!active && !waiting ? (
          <p className="ask__rail-empty">
            Sources and checks for each answer appear here. Nothing is shown that the server did not
            report.
          </p>
        ) : (
          <>
            <ol className="ask-steps">
              <Step
                state={t || activeParts?.text ? 'done' : 'active'}
                label="Scope"
                detail={t ? SCOPE_LABEL[t.scope] : undefined}
              />
              <Step
                state={refused ? 'idle' : t ? 'done' : 'idle'}
                label="Retrieval"
                detail={t ? `${t.sources} ${t.sources === 1 ? 'page' : 'pages'}` : undefined}
              />
              <Step
                state={
                  refused
                    ? 'idle'
                    : activeIsLive
                      ? 'active'
                      : answeredNow && t?.provider
                        ? 'done'
                        : 'idle'
                }
                label="Answer"
                detail={t?.provider}
              />
              <Step
                state={
                  t?.guard === 'blocked'
                    ? 'blocked'
                    : t?.guard === 'passed'
                      ? 'done'
                      : activeIsLive
                        ? 'active'
                        : 'idle'
                }
                label="Output guard"
                detail={t?.guard}
              />
            </ol>
            {refused && (
              <p className="ask__rail-note">
                The classifier judged this outside what the assistant covers, so no answer was
                generated.
              </p>
            )}
            {activeParts && activeParts.sources.length > 0 && (
              <>
                <h3>Read the source</h3>
                <ul className="ask__sources">
                  {activeParts.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url}>
                        <strong>{s.title ?? s.url}</strong>
                        <span>{s.url.replace('https://piyushmehta.com', '')}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </aside>
      <div ref={turnstileHost} className="ask__turnstile" />
    </section>
  );
}
