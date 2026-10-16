import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { ChatUIMessage } from '../../utils/chat/pipeline';
import { useCallback, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (id: string) => void;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SESSION_REFRESH_MS = 25 * 60 * 1000;
const TURNSTILE_TIMEOUT_MS = 20_000;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile'));
    document.head.appendChild(s);
  });
}

/** Wraps useChat with Turnstile -> session-token handshake. */
export function useAskPiyush(siteKey: string) {
  const session = useRef<{ token: string; at: number } | null>(null);
  const pending = useRef<Promise<string> | null>(null);
  const host = useRef<HTMLDivElement | null>(null);
  const [verifyError, setVerifyError] = useState('');

  const getSession = useCallback(async (): Promise<string> => {
    const cur = session.current;
    if (cur && Date.now() - cur.at < SESSION_REFRESH_MS) return cur.token;
    pending.current ??= (async () => {
      try {
        await loadTurnstile();
        const el = host.current;
        if (!el || !window.turnstile) throw new Error('turnstile');
        let widgetId: string | undefined;
        const turnstileToken = await new Promise<string>((resolve, reject) => {
          const fail = () => reject(new Error('turnstile'));
          const timer = window.setTimeout(fail, TURNSTILE_TIMEOUT_MS);
          widgetId = window.turnstile!.render(el, {
            sitekey: siteKey,
            action: 'chat-session',
            size: 'invisible',
            // Run only when we call execute(); the default runs on render and then warns on our execute().
            execution: 'execute',
            callback: (t: string) => {
              window.clearTimeout(timer);
              resolve(t);
            },
            'error-callback': fail,
            'timeout-callback': fail,
            'expired-callback': fail,
          });
          window.turnstile!.execute(widgetId);
        }).finally(() => {
          if (widgetId) window.turnstile?.remove(widgetId);
        });
        const res = await fetch('/api/chat/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { session: token } = (await res.json()) as { session: string };
        session.current = { token, at: Date.now() };
        setVerifyError('');
        return token;
      } catch {
        setVerifyError('Could not verify your browser. Reload the page and try again.');
        throw new Error('verify');
      } finally {
        pending.current = null;
      }
    })();
    return pending.current;
  }, [siteKey]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: '/api/chat',
        // A session is bound to the client IP; after a network change the server answers 401,
        // so drop the cached token and retry once with a fresh one.
        fetch: async (input, init) => {
          const send = async () =>
            fetch(input, {
              ...init,
              headers: {
                ...(init?.headers as Record<string, string>),
                'x-chat-session': await getSession(),
              },
            });
          const res = await send();
          if (res.status !== 401) return res;
          session.current = null;
          return send();
        },
        // Only the plain-text turns are sent; the server re-validates everything.
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages: messages.map((m) => ({
              role: m.role,
              parts: m.parts
                .filter((p) => p.type === 'text')
                .map((p) => ({ type: 'text', text: (p as { text: string }).text })),
            })),
          },
        }),
      }),
    [getSession],
  );

  const chat = useChat<ChatUIMessage>({ transport });
  return { ...chat, turnstileHost: host, verifyError };
}
