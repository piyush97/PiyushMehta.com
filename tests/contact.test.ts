import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { sendContactEmail } from '../src/utils/contact';

const input = {
  apiKey: 're_test_key',
  fromAddress: 'contact@piyushmehta.com',
  toAddress: 'inbox@piyushmehta.com',
  name: 'Reader <script>',
  email: 'reader@example.com',
  subject: 'Hello & welcome',
  message: 'This is a message with <unsafe> content.',
};

function captureFetch(): {
  fetch: typeof fetch;
  getInit: () => RequestInit | undefined;
  getUrl: () => string;
} {
  let capturedInit: RequestInit | undefined;
  let capturedUrl = '';
  const fetchFn: typeof fetch = async (input, init) => {
    capturedUrl = typeof input === 'string' ? input : input.toString();
    capturedInit = init;
    return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 });
  };
  return {
    fetch: fetchFn,
    getInit: () => capturedInit,
    getUrl: () => capturedUrl,
  };
}

describe('sendContactEmail', () => {
  it('sends the Resend payload with required headers and timeout', async () => {
    const { fetch: mock, getInit, getUrl } = captureFetch();
    await sendContactEmail(input, mock);

    assert.equal(getUrl(), 'https://api.resend.com/emails');
    const init = getInit();
    assert.ok(init);
    assert.equal(init.method, 'POST');
    assert.equal(init.signal instanceof AbortSignal, true);
    assert.equal((init.headers as Record<string, string>)['Authorization'], 'Bearer re_test_key');
    assert.equal((init.headers as Record<string, string>)['User-Agent'], 'piyushmehta.com/1.0');
  });

  it('escapes HTML while preserving the plain-text message', async () => {
    let body: Record<string, unknown> | undefined;
    const mock: typeof fetch = async (_input, init) => {
      body = JSON.parse(init?.body as string) as Record<string, unknown>;
      return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 });
    };

    await sendContactEmail(input, mock);
    assert.ok(body);
    assert.match(String(body.html), /&lt;script&gt;/);
    assert.match(String(body.text), /Reader <script>/);
    assert.equal(body.reply_to, 'reader@example.com');
  });

  it('throws a bounded provider error without exposing the response body', async () => {
    const mock: typeof fetch = async () =>
      new Response('secret provider detail', { status: 502 });

    await assert.rejects(
      () => sendContactEmail(input, mock),
      /Resend API error 502/,
    );
  });
});
