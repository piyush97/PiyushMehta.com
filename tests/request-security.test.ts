import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { getClientIp, getRateLimitKey, isAllowedFormOrigin, readLimitedText } from '../src/utils/request-security';

describe('client address boundaries', () => {
  it('rejects missing or malformed addresses without trusting forwarding headers', () => {
    assert.equal(getClientIp(new Request('https://example.com', { headers: { 'x-forwarded-for': '192.0.2.1' } })), '');
    assert.equal(getClientIp(new Request('https://example.com', { headers: { 'cf-connecting-ip': 'not-an-ip' } })), '');
  });
  it('groups IPv6 privacy addresses by /64 but preserves IPv4 identities', () => {
    assert.equal(getRateLimitKey('2001:db8:1:2::1'), getRateLimitKey('2001:0db8:0001:0002:ffff:abcd:1:2'));
    assert.notEqual(getRateLimitKey('2001:db8:1:2::1'), getRateLimitKey('2001:db8:1:3::1'));
    assert.equal(getRateLimitKey('::ffff:192.0.2.1'), '192.0.2.1');
    assert.equal(getRateLimitKey('192.0.2.1'), '192.0.2.1');
  });
});

describe('rate-limit backend failures', () => {
  it('denies SDK timeouts and rejected backends, normalizes keys and returns retry hints', async () => {
    const { mock } = await import('bun:test');
    mock.module('varlock/env', () => ({ ENV: {} }));
    const { limitOrUnavailable } = await import('../src/utils/redis');
    const result = { success: true, limit: 1, remaining: 0, reset: Date.now() + 30_000, pending: Promise.resolve() };
    assert.equal((await limitOrUnavailable(null, 'all'))?.status, 503);
    assert.equal((await limitOrUnavailable({ limit: async () => ({ ...result, reason: 'timeout' }) }, 'all'))?.status, 503);
    assert.equal((await limitOrUnavailable({ limit: async () => { throw new Error('offline'); } }, 'all'))?.status, 503);
    const denied = await limitOrUnavailable({ limit: async () => ({ ...result, success: false }) }, 'all');
    assert.equal(denied?.status, 429);
    assert.ok(Number(denied?.headers.get('retry-after')) > 0);
    let key = '';
    assert.equal(await limitOrUnavailable({ limit: async (value) => { key = value; return result; } }, '2001:db8:1:2::1'), null);
    assert.equal(key, getRateLimitKey('2001:db8:1:2::ffff'));
  });
});

describe('isAllowedFormOrigin', () => {
  it('accepts the production origin', () => {
    assert.equal(
      isAllowedFormOrigin(
        new Request('https://piyushmehta.com/api/contact', {
          method: 'POST',
          headers: { origin: 'https://piyushmehta.com' },
        }),
      ),
      true,
    );
  });

  it('accepts a same-origin preview request', () => {
    assert.equal(
      isAllowedFormOrigin(
        new Request('https://preview.example.com/api/contact', {
          method: 'POST',
          headers: { origin: 'https://preview.example.com' },
        }),
      ),
      true,
    );
  });

  it('falls back to a valid referer origin', () => {
    assert.equal(
      isAllowedFormOrigin(
        new Request('https://piyushmehta.com/api/contact', {
          method: 'POST',
          headers: { referer: 'https://piyushmehta.com/contact-me/' },
        }),
      ),
      true,
    );
  });

  it('rejects lookalike and missing origins', () => {
    assert.equal(
      isAllowedFormOrigin(
        new Request('https://piyushmehta.com/api/contact', {
          method: 'POST',
          headers: { origin: 'https://piyushmehta.com.evil.example' },
        }),
      ),
      false,
    );
    assert.equal(isAllowedFormOrigin(new Request('https://piyushmehta.com/api/contact')), false);
  });
});

describe('readLimitedText', () => {
  it('preserves multibyte text split across chunks at the byte limit', async () => {
    const bytes = new TextEncoder().encode('a😀');
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 3));
        controller.enqueue(bytes.slice(3));
        controller.close();
      },
    });
    assert.equal(await readLimitedText(new Request('https://example.com', { method: 'POST', body }), 5), 'a😀');
  });

  it('cancels oversized chunked bodies without reading the rest', async () => {
    let cancelled = false;
    const body = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(64 * 1024)); },
      cancel() { cancelled = true; },
    });
    assert.equal(await readLimitedText(new Request('https://example.com', { method: 'POST', body }), 8192), null);
    assert.equal(cancelled, true);
  });

  it('rejects oversized declared lengths and accepts empty bodies', async () => {
    assert.equal(await readLimitedText(new Request('https://example.com', {
      method: 'POST', headers: { 'content-length': '65536' }, body: '{}',
    }), 8192), null);
    assert.equal(await readLimitedText(new Request('https://example.com'), 8192), '');
  });
});

describe('configured API failures', () => {
  it('keeps limiter outages fail-closed, checks contact proofs and caps before sending', async () => {
    const { mock } = await import('bun:test');
    const original = { ...await import('../src/utils/redis') };
    const originalFetch = globalThis.fetch;
    const env: Record<string, string> = {
      TURNSTILE_SECRET_KEY: 'unit-test-only', RESEND_API_KEY: 'unit-test-only',
      CHAT_SESSION_SECRET: 'unit-test-session-signing-value', PUBLIC_TURNSTILE_SITE_KEY: 'unit-test-public-key',
    };
    let state: 'allow' | 'deny' | 'throw' | 'global' = 'throw';
    let proof = true;
    let sent: Record<string, unknown> | undefined;
    mock.module('varlock/env', () => ({ ENV: env }));
    mock.module('cloudflare:workers', () => ({ env: {} }));
    mock.module('../src/utils/redis', () => ({
      ...original,
      reactionRedis: { incr: async () => 1, expire: async () => 1 },
      createRatelimit: (prefix: string) => ({ limit: async () => {
        if (state === 'throw') throw new Error('offline');
        return { success: state !== 'deny' && !(state === 'global' && prefix.endsWith(':global')), limit: 5, remaining: 0, reset: Date.now() + 30_000 };
      } }),
    }));
    globalThis.fetch = (async (url, init) => {
      if (String(url).includes('siteverify')) return Response.json({ success: proof, action: 'contact-form', hostname: 'piyushmehta.com' });
      if (String(url).includes('api.resend.com')) { sent = JSON.parse(String(init?.body)); return Response.json({ id: 'test-delivery' }); }
      throw new Error('Unexpected network request');
    }) as typeof fetch;
    try {
      const contact = (await import('../src/pages/api/contact')).POST;
      const session = await import('../src/pages/api/chat/session');
      const conversions = (await import('../src/pages/api/conversions')).POST;
      const reactions = (await import('../src/pages/api/reactions')).POST;
      const chat = (await import('../src/pages/api/chat')).POST;
      const { signSession } = await import('../src/utils/chat/session');
      const slugs = (await import('../src/data/published-post-slugs.json')).default;
      const invoke = async (handler: typeof contact, body: unknown, headers: Record<string, string> = {}) => {
        const request = new Request('https://piyushmehta.com/api/contact', {
          method: 'POST', headers: { Origin: 'https://piyushmehta.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.10', ...headers },
          body: JSON.stringify(body),
        });
        return await handler({ request, url: new URL(request.url), clientAddress: '203.0.113.10', locals: {} } as Parameters<typeof handler>[0]) as Response;
      };
      const message = { name: 'Test\r\nName', email: 'test@example.com', subject: 'Hello\r\nSubject', message: 'A valid test message.', token: 'test-proof' };
      for (const [handler, body] of [[contact, message], [session.POST, { token: 'test-proof' }], [conversions, { event: 'resume_download' }], [reactions, { postId: slugs[0], reaction: 'like', action: 'add' }]] as const) {
        const response = await invoke(handler, body);
        assert.equal(response.status, 503);
        assert.equal(response.headers.get('retry-after'), '30');
      }
      const sessionHeader = { 'x-chat-session': await signSession(env.CHAT_SESSION_SECRET!, '203.0.113.10') };
      const question = { messages: [{ role: 'user', parts: [{ type: 'text', text: 'hello' }] }] };
      assert.equal((await invoke(chat, question, { Origin: 'https://evil.example' })).status, 403);
      assert.equal((await invoke(chat, 'x'.repeat(65_536))).status, 413);
      assert.equal((await invoke(chat, question)).status, 401);
      assert.equal((await invoke(chat, question, sessionHeader)).status, 503);
      state = 'deny';
      assert.equal((await invoke(chat, question, sessionHeader)).status, 429);
      assert.equal((await invoke(contact, message)).status, 429);
      state = 'allow';
      assert.equal((await invoke(chat, undefined, sessionHeader)).status, 400);
      assert.equal((await invoke(chat, {}, sessionHeader)).status, 422);
      state = 'global';
      assert.equal((await invoke(chat, question, sessionHeader)).status, 503);
      state = 'allow';
      assert.equal((await invoke(contact, { ...message, name: '' })).status, 422);
      assert.equal((await invoke(contact, { ...message, token: '' })).status, 403);
      proof = false;
      assert.equal((await invoke(contact, message)).status, 403);
      assert.equal(sent, undefined);
      proof = true;
      state = 'global';
      assert.equal((await invoke(contact, message)).status, 503);
      assert.equal(sent, undefined);
      state = 'allow';
      assert.equal((await invoke(contact, message)).status, 200);
      assert.equal(sent?.subject, '[Portfolio] Hello Subject');
      assert.ok(String(sent?.text).includes('Test Name'));
      delete env.RESEND_API_KEY;
      assert.equal((await invoke(contact, message)).status, 503);
      const config = await session.GET({} as Parameters<typeof session.GET>[0]) as Response;
      assert.deepEqual(await config.json(), { siteKey: 'unit-test-public-key' });
    } finally {
      globalThis.fetch = originalFetch;
      mock.module('../src/utils/redis', () => original);
      mock.module('varlock/env', () => ({ ENV: {} }));
    }
  });
});

describe('reaction count cache', () => {
  it('normalizes keys, reuses successful counts and never caches outages', async () => {
    const { mock } = await import('bun:test');
    const original = { ...await import('../src/utils/redis') };
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'caches');
    const entries = new Map<string, Response>();
    const pending: Promise<unknown>[] = [];
    let reads = 0;
    let offline = false;
    Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: {
      match: async (key: Request) => entries.get(key.url)?.clone(),
      put: async (key: Request, response: Response) => { entries.set(key.url, response); },
    } } });
    mock.module('../src/utils/redis', () => ({ ...original, redis: { hgetall: async () => {
      reads++;
      if (offline) throw new Error('offline');
      return { like: '3' };
    } } }));
    try {
      const { GET } = await import('../src/pages/api/reactions');
      const slugs = (await import('../src/data/published-post-slugs.json')).default;
      const invoke = (extra = '') => GET({ url: new URL(`https://piyushmehta.com/api/reactions?postId=${slugs[0]}${extra}`), locals: { cfContext: { waitUntil: (promise: Promise<unknown>) => pending.push(promise) } } } as Parameters<typeof GET>[0]);
      assert.equal((await invoke() as Response).status, 200);
      await Promise.all(pending);
      const hit = await invoke('&tracking=ignored') as Response;
      assert.equal((await hit.json()).like, 3);
      assert.equal(hit.headers.get('cache-control'), 'public, max-age=15');
      assert.equal(reads, 1);
      entries.clear();
      offline = true;
      assert.equal((await invoke() as Response).status, 503);
      assert.equal((await invoke() as Response).status, 503);
      assert.equal(entries.size, 0);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'caches', descriptor);
      else Reflect.deleteProperty(globalThis, 'caches');
      mock.module('../src/utils/redis', () => original);
    }
  });
});

describe('POST request boundaries', () => {
  it('rejects cross-origin, non-JSON, oversized and malformed bodies before service access', async () => {
    const { mock } = await import('bun:test');
    mock.module('varlock/env', () => ({ ENV: {} }));
    const routes = [
      ['contact', (await import('../src/pages/api/contact')).POST],
      ['reactions', (await import('../src/pages/api/reactions')).POST],
    ] as const;
    for (const [path, handler] of routes) {
      for (const [headers, body, expected] of [
        [{ origin: 'https://evil.example', 'content-type': 'application/json' }, '{}', 403],
        [{ origin: 'https://piyushmehta.com', 'content-type': 'text/plain' }, '{}', 415],
        [{ origin: 'https://piyushmehta.com', 'content-type': 'application/json; charset=utf-8' }, '{', 400],
        [{ origin: 'https://piyushmehta.com', 'content-type': 'application/json' }, new ReadableStream({
          start(controller) { controller.enqueue(new Uint8Array(64 * 1024)); controller.close(); },
        }), 413],
      ] as const) {
        const request = new Request(`https://piyushmehta.com/api/${path}`, { method: 'POST', headers, body });
        const response = await handler({ request, clientAddress: '127.0.0.1', locals: {} } as Parameters<typeof handler>[0]);
        assert.equal(response.status, expected, `${path}: ${expected}`);
      }
    }
  });
});
