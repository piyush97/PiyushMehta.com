/**
 * Newsletter logic with no framework imports, so the API routes, unit tests and
 * scripts/send-new-post.mjs all share one implementation.
 *
 * Storage: confirmed addresses live in the Redis set SUBSCRIBERS_KEY (lowercased).
 * Tokens are stateless and HMAC-signed: `<purpose>.<expiryMs>.<emailB64url>.<sigB64url>`.
 */

import { escapeXml as escapeHtml } from './xml';

export const SUBSCRIBERS_KEY = 'newsletter:subscribers';
export const MAX_EMAIL = 254;
export const MIN_SECRET_LENGTH = 32;
export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;
export const UNSUBSCRIBE_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export type TokenPurpose = 'confirm' | 'unsubscribe';
const PURPOSE_CODE: Record<TokenPurpose, string> = { confirm: 'c', unsubscribe: 'u' };
const MAX_TOKEN_LENGTH = 1024;

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

/** Trim and lowercase, or return null when the value is not a plain single address. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) return null;
  const [local] = email.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return null;
  }
  return email;
}

export function hasUsableSecret(secret: string | undefined): secret is string {
  return typeof secret === 'string' && secret.length >= MIN_SECRET_LENGTH;
}

const enc = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromB64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  try {
    const padded = value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signToken(
  secret: string,
  purpose: TokenPurpose,
  email: string,
  now = Date.now(),
): Promise<string> {
  const ttl = purpose === 'confirm' ? CONFIRM_TTL_MS : UNSUBSCRIBE_TTL_MS;
  const payload = `${PURPOSE_CODE[purpose]}.${now + ttl}.${toB64Url(enc.encode(email))}`;
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload)),
  );
  return `${payload}.${toB64Url(sig)}`;
}

/** Returns the normalized address for a valid, unexpired token of the given purpose, else null. */
export async function verifyToken(
  secret: string,
  token: unknown,
  purpose: TokenPurpose,
  now = Date.now(),
): Promise<string | null> {
  if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [code, exp, emailB64, sigB64] = parts;
  if (code !== PURPOSE_CODE[purpose] || !/^\d{10,15}$/.test(exp) || Number(exp) < now) return null;
  const sig = fromB64Url(sigB64);
  const emailBytes = fromB64Url(emailB64);
  if (!sig || !emailBytes) return null;
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    sig,
    enc.encode(`${code}.${exp}.${emailB64}`),
  );
  if (!valid) return null;
  const email = normalizeEmail(new TextDecoder().decode(emailBytes));
  return email;
}

export interface SubscriberStore {
  sadd(key: string, member: string): Promise<unknown>;
  srem(key: string, member: string): Promise<unknown>;
}

/** Applies a verified confirm (add) or unsubscribe (remove) token to the subscriber set. */
export async function applyToken(
  store: SubscriberStore | null,
  secret: string | undefined,
  token: unknown,
  purpose: TokenPurpose,
  now = Date.now(),
): Promise<'ok' | 'invalid' | 'unavailable'> {
  if (!store || !hasUsableSecret(secret)) return 'unavailable';
  const email = await verifyToken(secret, token, purpose, now);
  if (!email) return 'invalid';
  try {
    if (purpose === 'confirm') await store.sadd(SUBSCRIBERS_KEY, email);
    else await store.srem(SUBSCRIBERS_KEY, email);
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

export interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
}

export function buildConfirmEmail(input: {
  fromAddress: string;
  email: string;
  confirmUrl: string;
}): EmailPayload {
  const hours = CONFIRM_TTL_MS / 3_600_000;
  const url = escapeHtml(input.confirmUrl);
  return {
    from: `Piyush Mehta <${input.fromAddress}>`,
    to: [input.email],
    subject: 'Confirm your subscription to piyushmehta.com',
    text: [
      'Someone asked to get new posts from piyushmehta.com at this address.',
      '',
      `Confirm the subscription: ${input.confirmUrl}`,
      '',
      `The link works for ${hours} hours. If this was not you, ignore this email and nothing will be sent.`,
    ].join('\n'),
    html: `<p>Someone asked to get new posts from piyushmehta.com at this address.</p><p><a href="${url}">Confirm the subscription</a></p><p>The link works for ${hours} hours. If this was not you, ignore this email and nothing will be sent.</p>`,
  };
}

export function buildPostEmail(input: {
  fromAddress: string;
  email: string;
  title: string;
  description?: string;
  url: string;
  unsubscribeUrl: string;
}): EmailPayload {
  const description = input.description?.trim() ?? '';
  return {
    from: `Piyush Mehta <${input.fromAddress}>`,
    to: [input.email],
    subject: input.title,
    text: [
      `New post: ${input.title}`,
      ...(description ? ['', description] : []),
      '',
      `Read it: ${input.url}`,
      '',
      `You get this because you confirmed a subscription on piyushmehta.com. Unsubscribe: ${input.unsubscribeUrl}`,
    ].join('\n'),
    html: `<p>New post: <a href="${escapeHtml(input.url)}">${escapeHtml(input.title)}</a></p>${description ? `<p>${escapeHtml(description)}</p>` : ''}<p><a href="${escapeHtml(input.url)}">Read it on piyushmehta.com</a></p><p style="font-size:13px;color:#555">You get this because you confirmed a subscription on piyushmehta.com. <a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe</a></p>`,
    headers: {
      'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

export async function sendEmail(
  apiKey: string,
  payload: EmailPayload,
  _fetch: typeof fetch = fetch,
): Promise<void> {
  const response = await _fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Resend API error ${response.status}`);
}

/** Small self-contained HTML page for the token links; it embeds no user input. */
export function resultPage(
  status: number,
  heading: string,
  body: string,
  action?: { url: string; label: string },
): Response {
  const form = action
    ? `<form method="post" action="${escapeHtml(action.url)}"><button type="submit">${escapeHtml(action.label)}</button></form>`
    : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(heading)} | Piyush Mehta</title><style>:root{color-scheme:light dark}body{margin:0;font:1rem/1.6 system-ui,sans-serif;background:Canvas;color:CanvasText}main{max-width:34rem;margin:0 auto;padding:4rem 1.25rem}h1{font-size:1.5rem;line-height:1.2}a,button{font:inherit}a{color:LinkText;display:inline-block;min-height:2.75rem;line-height:2.75rem}button{min-height:2.75rem;padding:0 1.25rem;cursor:pointer}a:focus-visible,button:focus-visible{outline:2px solid currentColor;outline-offset:2px}</style></head><body><main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(body)}</p>${form}<p><a href="/">Back to piyushmehta.com</a></p></main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex',
    },
  });
}
