/** Turnstile verification. Returns true only on an explicit success from Cloudflare. */
export const TURNSTILE_ACTION = 'chat-session';

/** True only on explicit success for the expected action and a deployment hostname. */
export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string,
  expectedHostname: string,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  if (!token || token.length > 2048 || !expectedHostname) return false;
  try {
    const res = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
    return (
      data.success === true &&
      data.action === TURNSTILE_ACTION &&
      data.hostname === expectedHostname
    );
  } catch {
    return false;
  }
}

const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export const SESSION_TTL_MS = 30 * 60 * 1000;

/** Token format: `<expiryMs>.<ipHash>.<sig>`; bound to client IP so it cannot be replayed elsewhere. */
export async function signSession(secret: string, ip: string, now = Date.now()): Promise<string> {
  const exp = now + SESSION_TTL_MS;
  const ipHash = (await hmac(secret, `ip:${ip}`)).slice(0, 16);
  return `${exp}.${ipHash}.${await hmac(secret, `${exp}.${ipHash}`)}`;
}

export async function verifySession(
  secret: string,
  token: string,
  ip: string,
  now = Date.now(),
): Promise<boolean> {
  const [exp, ipHash, sig] = token.split('.');
  if (!exp || !ipHash || !sig || !/^\d{10,15}$/.test(exp)) return false;
  if (Number(exp) < now) return false;
  const expectedSig = await hmac(secret, `${exp}.${ipHash}`);
  const expectedIp = (await hmac(secret, `ip:${ip}`)).slice(0, 16);
  return timingSafeEqual(sig, expectedSig) && timingSafeEqual(ipHash, expectedIp);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
