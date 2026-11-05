import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { isAllowedFormOrigin, readLimitedText } from '../src/utils/request-security';

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
