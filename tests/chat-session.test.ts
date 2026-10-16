import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { signSession, verifySession, verifyTurnstile, SESSION_TTL_MS } from '../src/utils/chat/session';

const S = 'test-secret-test-secret-test-secret';

describe('session tokens', () => {
  it('verifies a fresh token for the same ip', async () => {
    const t = await signSession(S, '1.2.3.4');
    assert.equal(await verifySession(S, t, '1.2.3.4'), true);
  });
  it('rejects a different ip, secret, expiry, or tampering', async () => {
    const t = await signSession(S, '1.2.3.4', 1_000_000_000_000);
    const now = 1_000_000_000_000 + 1000;
    assert.equal(await verifySession(S, t, '9.9.9.9', now), false);
    assert.equal(await verifySession('other-secret', t, '1.2.3.4', now), false);
    assert.equal(await verifySession(S, t, '1.2.3.4', 1_000_000_000_000 + SESSION_TTL_MS + 1), false);
    const [exp, ip, sig] = t.split('.');
    assert.equal(await verifySession(S, `${Number(exp) + 99999}.${ip}.${sig}`, '1.2.3.4', now), false);
    assert.equal(await verifySession(S, 'garbage', '1.2.3.4', now), false);
    assert.equal(await verifySession(S, '', '1.2.3.4', now), false);
  });
});

describe('verifyTurnstile', () => {
  const ok = { success: true, action: 'chat-session', hostname: 'piyushmehta.com' };
  const f =
    (body: unknown, good = true): typeof fetch =>
    (async () => new Response(JSON.stringify(body), { status: good ? 200 : 500 })) as typeof fetch;
  const v = (body: unknown, good = true, host = 'piyushmehta.com') =>
    verifyTurnstile('s', 't', 'ip', host, f(body, good));
  it('true only on success with the expected action and hostname', async () => {
    assert.equal(await v(ok), true);
    assert.equal(await v({ ...ok, success: false }), false);
    assert.equal(await v({}), false);
    assert.equal(await v(ok, false), false);
  });
  it('rejects a wrong action or hostname', async () => {
    assert.equal(await v({ ...ok, action: 'contact' }), false);
    assert.equal(await v({ ...ok, hostname: 'evil.example' }), false);
    assert.equal(await v(ok, true, ''), false);
  });
  it('rejects empty and oversized tokens without calling the network', async () => {
    const never = (async () => {
      throw new Error('called');
    }) as typeof fetch;
    assert.equal(await verifyTurnstile('s', '', 'ip', 'h', never), false);
    assert.equal(await verifyTurnstile('s', 'x'.repeat(2049), 'ip', 'h', never), false);
  });
  it('false when the network throws', async () => {
    const boom = (async () => {
      throw new Error('x');
    }) as typeof fetch;
    assert.equal(await verifyTurnstile('s', 't', 'ip', 'h', boom), false);
  });
});
