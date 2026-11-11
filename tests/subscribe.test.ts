import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  CONFIRM_TTL_MS,
  SUBSCRIBERS_KEY,
  applyToken,
  buildConfirmEmail,
  buildPostEmail,
  normalizeEmail,
  sendEmail,
  signToken,
  verifyToken,
} from '../src/utils/subscribe';

const SECRET = 'test-secret-test-secret-test-secret';
const NOW = 1_800_000_000_000;

function memoryStore() {
  const set = new Set<string>();
  return {
    set,
    async sadd(_key: string, member: string) {
      set.add(member);
    },
    async srem(_key: string, member: string) {
      set.delete(member);
    },
  };
}

describe('normalizeEmail', () => {
  it('trims, lowercases and accepts plain addresses', () => {
    assert.equal(normalizeEmail('  Reader+tag@Example.COM '), 'reader+tag@example.com');
  });
  it('rejects malformed, multiple, header-injecting and oversized values', () => {
    for (const bad of [
      '',
      'no-at-sign',
      'a@b',
      'a b@example.com',
      'a@example.com, b@example.com',
      'a@example.com\r\nBcc: x@example.com',
      '.a@example.com',
      'a..b@example.com',
      `${'a'.repeat(250)}@example.com`,
      42,
      null,
      undefined,
    ]) {
      assert.equal(normalizeEmail(bad), null, String(bad));
    }
  });
});

describe('signed tokens', () => {
  it('round-trips a confirm token', async () => {
    const token = await signToken(SECRET, 'confirm', 'a@example.com', NOW);
    assert.equal(await verifyToken(SECRET, token, 'confirm', NOW + 1000), 'a@example.com');
  });
  it('expires after the confirm window', async () => {
    const token = await signToken(SECRET, 'confirm', 'a@example.com', NOW);
    assert.equal(await verifyToken(SECRET, token, 'confirm', NOW + CONFIRM_TTL_MS - 1), 'a@example.com');
    assert.equal(await verifyToken(SECRET, token, 'confirm', NOW + CONFIRM_TTL_MS + 1), null);
  });
  it('rejects a different secret and a different purpose', async () => {
    const token = await signToken(SECRET, 'confirm', 'a@example.com', NOW);
    assert.equal(await verifyToken('other-secret-other-secret-other-secret', token, 'confirm', NOW), null);
    assert.equal(await verifyToken(SECRET, token, 'unsubscribe', NOW), null);
  });
  it('rejects tampering with the address, expiry or signature', async () => {
    const token = await signToken(SECRET, 'confirm', 'a@example.com', NOW);
    const [code, exp, email, sig] = token.split('.');
    const forgedEmail = btoa('evil@example.com').replaceAll('=', '');
    assert.equal(await verifyToken(SECRET, `${code}.${exp}.${forgedEmail}.${sig}`, 'confirm', NOW), null);
    assert.equal(await verifyToken(SECRET, `${code}.${Number(exp) + 99999}.${email}.${sig}`, 'confirm', NOW), null);
    const flipped = sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A');
    assert.equal(await verifyToken(SECRET, `${code}.${exp}.${email}.${flipped}`, 'confirm', NOW), null);
  });
  it('rejects garbage input', async () => {
    for (const bad of ['', 'garbage', 'c.1.2', 'c.1800000000000.@@@.@@@', 'x'.repeat(5000), null, undefined, 7]) {
      assert.equal(await verifyToken(SECRET, bad, 'confirm', NOW), null);
    }
  });
});

describe('applyToken', () => {
  it('adds on confirm and removes on unsubscribe', async () => {
    const store = memoryStore();
    const confirm = await signToken(SECRET, 'confirm', 'a@example.com');
    assert.equal(await applyToken(store, SECRET, confirm, 'confirm'), 'ok');
    assert.deepEqual([...store.set], ['a@example.com']);
    const unsub = await signToken(SECRET, 'unsubscribe', 'a@example.com');
    assert.equal(await applyToken(store, SECRET, unsub, 'unsubscribe'), 'ok');
    assert.equal(store.set.size, 0);
  });
  it('does not write for invalid tokens and a confirm token cannot unsubscribe', async () => {
    const store = memoryStore();
    assert.equal(await applyToken(store, SECRET, 'nope', 'confirm'), 'invalid');
    const confirm = await signToken(SECRET, 'confirm', 'a@example.com');
    assert.equal(await applyToken(store, SECRET, confirm, 'unsubscribe'), 'invalid');
    assert.equal(store.set.size, 0);
  });
  it('fails closed without a store, a usable secret, or when the store throws', async () => {
    const token = await signToken(SECRET, 'confirm', 'a@example.com');
    assert.equal(await applyToken(null, SECRET, token, 'confirm'), 'unavailable');
    assert.equal(await applyToken(memoryStore(), undefined, token, 'confirm'), 'unavailable');
    assert.equal(await applyToken(memoryStore(), 'short', token, 'confirm'), 'unavailable');
    const broken = {
      async sadd() {
        throw new Error('offline');
      },
      async srem() {
        throw new Error('offline');
      },
    };
    assert.equal(await applyToken(broken, SECRET, token, 'confirm'), 'unavailable');
  });
});

describe('email building and sending', () => {
  it('escapes HTML in the confirm link and post fields', () => {
    const confirm = buildConfirmEmail({
      fromAddress: 'from@example.com',
      email: 'a@example.com',
      confirmUrl: 'https://piyushmehta.com/api/subscribe/confirm?token=a&b="x"',
    });
    assert.match(confirm.html, /token=a&amp;b=&quot;x&quot;/);
    assert.match(confirm.text, /token=a&b="x"/);
    assert.deepEqual(confirm.to, ['a@example.com']);

    const post = buildPostEmail({
      fromAddress: 'from@example.com',
      email: 'a@example.com',
      title: 'Use <b> carefully',
      description: 'A & B',
      url: 'https://piyushmehta.com/blog/x',
      unsubscribeUrl: 'https://piyushmehta.com/api/subscribe/unsubscribe?token=t',
    });
    assert.match(post.html, /Use &lt;b&gt; carefully/);
    assert.equal(post.subject, 'Use <b> carefully');
    assert.equal(post.headers?.['List-Unsubscribe'], '<https://piyushmehta.com/api/subscribe/unsubscribe?token=t>');
  });
  it('posts to Resend with bearer auth and throws a bounded error', async () => {
    let url = '';
    let init: RequestInit | undefined;
    const ok: typeof fetch = async (input, i) => {
      url = String(input);
      init = i;
      return new Response('{}', { status: 200 });
    };
    const payload = buildConfirmEmail({ fromAddress: 'f@example.com', email: 'a@example.com', confirmUrl: 'https://x.test/' });
    await sendEmail('re_test', payload, ok);
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer re_test');
    assert.ok(init?.signal instanceof AbortSignal);
    const bad: typeof fetch = async () => new Response('provider detail', { status: 502 });
    await assert.rejects(() => sendEmail('re_test', payload, bad), /Resend API error 502/);
  });
  it('uses a stable subscriber set key', () => {
    assert.equal(SUBSCRIBERS_KEY, 'newsletter:subscribers');
  });
});

describe('subscribe handlers', () => {
  it('fail closed, validate in order, and never send before verification', async () => {
    const { mock } = await import('bun:test');
    mock.module('varlock/env', () => ({ ENV: {} }));
    const original = { ...(await import('../src/utils/redis')) };
    const originalFetch = globalThis.fetch;
    const env: Record<string, string> = {
      RESEND_API_KEY: 're_test_key',
      CONTACT_FROM_EMAIL: 'from@example.com',
      TURNSTILE_SECRET_KEY: 'turnstile-secret',
      NEWSLETTER_SIGNING_SECRET: SECRET,
    };
    let limiter: 'allow' | 'deny' | 'throw' | 'global' = 'throw';
    let proof = true;
    let proofAction = 'newsletter-signup';
    const sent: Array<Record<string, unknown>> = [];
    const store = memoryStore();
    mock.module('varlock/env', () => ({ ENV: env }));
    mock.module('cloudflare:workers', () => ({ env: {} }));
    mock.module('../src/utils/redis', () => ({
      ...original,
      reactionRedis: store,
      createRatelimit: (prefix: string) => ({
        limit: async () => {
          if (limiter === 'throw') throw new Error('offline');
          return {
            success: limiter !== 'deny' && !(limiter === 'global' && prefix.endsWith(':global')),
            limit: 3,
            remaining: 0,
            reset: Date.now() + 30_000,
          };
        },
      }),
    }));
    globalThis.fetch = (async (url, init) => {
      const href = new URL(url instanceof Request ? url.url : url).href;
      if (href === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
        return Response.json({ success: proof, action: proofAction, hostname: 'piyushmehta.com' });
      }
      if (href === 'https://api.resend.com/emails') {
        sent.push(JSON.parse(String(init?.body)));
        return Response.json({ id: 'test' });
      }
      throw new Error('Unexpected network request');
    }) as typeof fetch;

    try {
      const subscribe = (await import('../src/pages/api/subscribe')).POST;
      const confirm = (await import('../src/pages/api/subscribe/confirm')).GET;
      const unsub = await import('../src/pages/api/subscribe/unsubscribe');

      const invoke = async (body: unknown, headers: Record<string, string> = {}) => {
        const request = new Request('https://piyushmehta.com/api/subscribe', {
          method: 'POST',
          headers: {
            Origin: 'https://piyushmehta.com',
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '203.0.113.7',
            ...headers,
          },
          body: typeof body === 'string' ? body : JSON.stringify(body),
        });
        return (await subscribe({
          request,
          url: new URL(request.url),
          clientAddress: '203.0.113.7',
          locals: {},
        } as Parameters<typeof subscribe>[0])) as Response;
      };
      const valid = { email: 'Reader@Example.com', token: 'ts-token' };

      assert.equal((await invoke(valid, { Origin: 'https://evil.example' })).status, 403);
      assert.equal((await invoke(valid, { 'Content-Type': 'text/plain' })).status, 415);
      assert.equal((await invoke('x'.repeat(10_000))).status, 413);
      assert.equal((await invoke('{not json')).status, 400);
      assert.deepEqual(await (await invoke({ ...valid, website: 'spam' })).json(), { ok: true });

      limiter = 'throw';
      const unavailable = await invoke(valid);
      assert.equal(unavailable.status, 503);
      assert.equal(unavailable.headers.get('retry-after'), '30');

      limiter = 'deny';
      assert.equal((await invoke(valid)).status, 429);

      limiter = 'allow';
      assert.equal((await invoke({ ...valid, email: 'not-an-email' })).status, 422);
      assert.equal((await invoke({ token: 'ts-token' })).status, 422);

      assert.equal((await invoke({ email: valid.email })).status, 403);
      proof = false;
      assert.equal((await invoke(valid)).status, 403);
      proof = true;
      proofAction = 'contact-form';
      assert.equal((await invoke(valid)).status, 403);
      proofAction = 'newsletter-signup';
      assert.equal(sent.length, 0);

      limiter = 'global';
      assert.equal((await invoke(valid)).status, 503);
      assert.equal(sent.length, 0);

      for (const key of ['NEWSLETTER_SIGNING_SECRET', 'TURNSTILE_SECRET_KEY', 'RESEND_API_KEY', 'CONTACT_FROM_EMAIL']) {
        limiter = 'allow';
        const saved = env[key];
        delete env[key];
        assert.equal((await invoke(valid)).status, 503, key);
        env[key] = saved;
      }
      env.NEWSLETTER_SIGNING_SECRET = 'too-short';
      assert.equal((await invoke(valid)).status, 503);
      env.NEWSLETTER_SIGNING_SECRET = SECRET;
      assert.equal(sent.length, 0);

      limiter = 'allow';
      const ok = await invoke(valid);
      assert.equal(ok.status, 200);
      assert.equal(sent.length, 1);
      assert.deepEqual(sent[0].to, ['reader@example.com']);
      assert.equal(store.set.size, 0, 'nothing is stored before confirmation');

      const link = String(sent[0].text).match(/https:\/\/\S+/)?.[0] ?? '';
      const token = new URL(link).searchParams.get('token');
      assert.ok(token);

      const confirmUrl = (value: string | null) =>
        new URL(`https://piyushmehta.com/api/subscribe/confirm${value === null ? '' : `?token=${value}`}`);
      const call = (handler: unknown, url: URL, method = 'GET') =>
        (handler as (ctx: unknown) => Promise<Response>)({ url, request: new Request(url, { method }), locals: {} });

      assert.equal((await call(confirm, confirmUrl(null))).status, 400);
      assert.equal((await call(confirm, confirmUrl('garbage'))).status, 400);
      assert.equal(store.set.size, 0);
      assert.equal((await call(confirm, confirmUrl(token))).status, 200);
      assert.deepEqual([...store.set], ['reader@example.com']);

      const unsubToken = await signToken(SECRET, 'unsubscribe', 'reader@example.com');
      const unsubUrl = new URL(`https://piyushmehta.com/api/subscribe/unsubscribe?token=${unsubToken}`);
      const page = await call(unsub.GET, unsubUrl);
      assert.equal(page.status, 200);
      assert.equal(store.set.size, 1, 'GET never unsubscribes');
      assert.equal((await call(unsub.POST, unsubUrl, 'POST')).status, 200);
      assert.equal(store.set.size, 0);
      assert.equal((await call(unsub.POST, confirmUrl(token), 'POST')).status, 400);
    } finally {
      globalThis.fetch = originalFetch;
      mock.module('../src/utils/redis', () => original);
      mock.module('varlock/env', () => ({ ENV: {} }));
    }
  });
});
