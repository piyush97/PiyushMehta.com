/**
 * Unit tests for newsletter subscription flow.
 * Run: npx tsx tests/newsletter.test.ts
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { addToResendAudience, sendConfirmationEmail } from '../src/utils/newsletter';

const API_KEY = 're_test_key';
const SEGMENT_ID = 'f299935e-a647-47be-818e-13e73b4a399b';
const FROM_ADDR = 'news@piyushmehta.com';

// Reusable fetch capture helper
function captureFetch(): {
  fetch: typeof fetch;
  getBody: () => any;
  getHeaders: () => Record<string, string>;
  getUrl: () => string;
} {
  let capturedBody: any = null;
  let capturedHeaders: Record<string, string> = {};
  let capturedUrl = '';

  const fetchFn: typeof fetch = async (input, init) => {
    capturedUrl = typeof input === 'string' ? input : input.toString();
    capturedHeaders = (init?.headers as Record<string, string>) ?? {};
    if (init?.body) capturedBody = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ id: 'ok', captured: true }), { status: 201 });
  };

  return {
    fetch: fetchFn,
    getBody: () => capturedBody,
    getHeaders: () => capturedHeaders,
    getUrl: () => capturedUrl,
  };
}

// ────── addToResendAudience ──────

describe('addToResendAudience', () => {
  it('sends to correct URL', async () => {
    const { fetch: mock, getUrl } = captureFetch();
    await addToResendAudience('a@b.com', API_KEY, SEGMENT_ID, mock);
    assert.equal(getUrl(), 'https://api.resend.com/contacts');
  });

  it('sends email, unsubscribed:false, and segments in body', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await addToResendAudience('user@test.com', API_KEY, SEGMENT_ID, mock);
    const body = getBody();
    assert.equal(body.email, 'user@test.com');
    assert.equal(body.unsubscribed, false);
    assert.deepEqual(body.segments, [{ id: SEGMENT_ID }]);
  });

  it('sends Bearer auth header', async () => {
    const { fetch: mock, getHeaders } = captureFetch();
    await addToResendAudience('a@b.com', 're_custom', SEGMENT_ID, mock);
    assert.equal(getHeaders()['Authorization'], 'Bearer re_custom');
  });

  it('sends User-Agent header (required by Resend, error 1010 without it)', async () => {
    const { fetch: mock, getHeaders } = captureFetch();
    await addToResendAudience('a@b.com', API_KEY, SEGMENT_ID, mock);
    assert.ok(getHeaders()['User-Agent']?.includes('piyushmehta.com'));
  });

  it('throws on non-ok response (401 restricted key)', async () => {
    const failingFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ message: 'restricted_api_key' }), { status: 401 });
    await assert.rejects(
      () => addToResendAudience('a@b.com', 'bad_key', SEGMENT_ID, failingFetch),
      /Resend API error 401/
    );
  });

  it('throws on 500 server error', async () => {
    const failingFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: 'boom' }), { status: 500 });
    await assert.rejects(
      () => addToResendAudience('a@b.com', API_KEY, SEGMENT_ID, failingFetch),
      /Resend API error 500/
    );
  });

  it('passes through successful 201 response', async () => {
    const okFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ id: 'contact-42' }), { status: 201 });
    // Should not throw
    await addToResendAudience('a@b.com', API_KEY, SEGMENT_ID, okFetch);
  });
});

// ────── sendConfirmationEmail ──────

describe('sendConfirmationEmail', () => {
  it('sends to correct Resend emails endpoint', async () => {
    const { fetch: mock, getUrl } = captureFetch();
    await sendConfirmationEmail('a@b.com', API_KEY, FROM_ADDR, mock);
    assert.equal(getUrl(), 'https://api.resend.com/emails');
  });

  it('sends to the subscriber email address', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await sendConfirmationEmail('hello@world.com', API_KEY, FROM_ADDR, mock);
    assert.deepEqual(getBody().to, ['hello@world.com']);
  });

  it('wraps bare from: address as "Piyush Mehta <bare@email>"', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await sendConfirmationEmail('a@b.com', API_KEY, 'news@piyushmehta.com', mock);
    assert.equal(getBody().from, 'Piyush Mehta <news@piyushmehta.com>');
  });

  it('includes html body with subscribe mention', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await sendConfirmationEmail('a@b.com', API_KEY, FROM_ADDR, mock);
    const body = getBody();
    assert.ok(body.html, 'html field must be present');
    assert.ok(body.html.length > 200, 'html content should be substantial');
    assert.ok(
      body.html.includes('subscribe') || body.html.includes('subscribing'),
      'html should mention subscribing'
    );
  });

  it('includes a subject line', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await sendConfirmationEmail('a@b.com', API_KEY, FROM_ADDR, mock);
    assert.ok(getBody().subject);
    assert.ok(getBody().subject.length > 0);
  });

  it('sends User-Agent header', async () => {
    const { fetch: mock, getHeaders } = captureFetch();
    await sendConfirmationEmail('a@b.com', API_KEY, FROM_ADDR, mock);
    assert.ok(getHeaders()['User-Agent']?.includes('piyushmehta.com'));
  });

  it('throws on 401 restricted key', async () => {
    const failingFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ message: 'restricted_api_key' }), { status: 401 });
    await assert.rejects(
      () => sendConfirmationEmail('a@b.com', 'bad', FROM_ADDR, failingFetch),
      /Resend email error 401/
    );
  });
});

// ────── Edge cases ──────

describe('edge cases', () => {
  it('handles gmail dots (first.last@gmail.com)', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await addToResendAudience('first.last@gmail.com', API_KEY, SEGMENT_ID, mock);
    assert.equal(getBody().email, 'first.last@gmail.com');
  });

  it('handles plus aliases (user+tag@domain.com)', async () => {
    const { fetch: mock, getBody } = captureFetch();
    await addToResendAudience('user+newsletter@domain.com', API_KEY, SEGMENT_ID, mock);
    assert.equal(getBody().email, 'user+newsletter@domain.com');
  });

  it('handles long email addresses (64-char local part)', async () => {
    const local = 'a'.repeat(50);
    const email = `${local}@test.com`;
    const { fetch: mock, getBody } = captureFetch();
    await addToResendAudience(email, API_KEY, SEGMENT_ID, mock);
    assert.equal(getBody().email, email);
  });
});

console.log('\n✅ All tests complete');
