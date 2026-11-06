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

let sdk: Promise<void> | undefined;

/** Share the SDK and bound its loading/execution without importing the chat bundle. */
export async function requestTurnstileToken(
  host: HTMLElement,
  siteKey: string,
  action: string,
): Promise<string> {
  if (!siteKey) throw new Error('Verification unavailable.');
  if (!window.turnstile) {
    sdk ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => {
        window.clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        sdk = undefined;
        reject(new Error('Verification unavailable.'));
      };
      const timer = window.setTimeout(fail, 10_000);
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timer);
        fail();
      };
      document.head.appendChild(script);
    });
    await sdk;
  }
  const turnstile = window.turnstile;
  if (!turnstile) throw new Error('Verification unavailable.');
  let widget: string | undefined;
  let timer: number | undefined;
  try {
    return await new Promise<string>((resolve, reject) => {
      const fail = () => reject(new Error('Verification failed. Please retry.'));
      timer = window.setTimeout(fail, 20_000);
      widget = turnstile.render(host, {
        sitekey: siteKey,
        action,
        size: 'invisible',
        execution: 'execute',
        callback: resolve,
        'error-callback': fail,
        'timeout-callback': fail,
        'expired-callback': fail,
      });
      turnstile.execute(widget);
    });
  } finally {
    window.clearTimeout(timer);
    if (widget !== undefined) turnstile.remove(widget);
  }
}
