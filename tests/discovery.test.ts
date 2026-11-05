import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { SECURITY_HEADERS } from '../src/middleware/security';
import { onRequest as markdown } from '../src/middleware/markdown';
import { generateCanonicalUrl } from '../src/utils/og-generator';
import { escapeXml, serializeJson } from '../src/utils/xml';

describe('canonical discovery URLs', () => {
  for (const base of ['https://piyushmehta.com', 'https://piyushmehta.com/']) {
    it(`joins an Astro site URL correctly: ${base}`, () => {
      assert.equal(generateCanonicalUrl('/services/', base), 'https://piyushmehta.com/services');
      assert.equal(generateCanonicalUrl('/', base), 'https://piyushmehta.com/');
      assert.equal(generateCanonicalUrl('blog/example/', base), 'https://piyushmehta.com/blog/example');
    });
  }
  it('removes tracking, fragments and repeated slashes without changing path case', () => {
    assert.equal(generateCanonicalUrl('//blog///My-Post/?utm_source=linkedin#example', 'https://piyushmehta.com/'), 'https://piyushmehta.com/blog/My-Post');
  });
  it('requires an explicit base', () => {
    assert.throws(() => generateCanonicalUrl('/blog'), /baseUrl is required/);
  });
});

describe('script JSON serialization', () => {
  it('escapes script terminators without changing the decoded data', () => {
    const value = { title: '</script><script>alert(1)</script>', text: '<!-- & 😀' };
    const serialized = serializeJson(value);
    assert.equal(serialized.includes('<'), false);
    assert.ok(serialized.includes('\\u003c'));
    assert.deepEqual(JSON.parse(serialized), value);
  });
});

describe('security headers', () => {
  it('keeps static and Worker browser isolation policies aligned', () => {
    const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
    for (const name of ['Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy', 'Permissions-Policy']) {
      assert.ok(headers.includes(`${name}: ${SECURITY_HEADERS[name]}`), name);
    }
    assert.equal(SECURITY_HEADERS['Permissions-Policy'].includes('interest-cohort'), false);
  });
});

describe('markdown negotiation', () => {
  it('varies both representations on Accept while preserving other cache keys', async () => {
    for (const accept of ['text/html', 'text/markdown']) {
      const request = new Request('https://piyushmehta.com/blog/example', { headers: { accept } });
      const response = await markdown({ request, isPrerendered: false } as Parameters<typeof markdown>[0], async () => new Response(
        '<html><body><main><h1>Example</h1><p>Hello</p></main></body></html>',
        { headers: { 'content-type': 'text/html', vary: 'Accept-Encoding', 'content-length': '99', etag: '"html"' } },
      ));
      assert.ok(response);
      assert.equal(response.headers.get('Vary'), 'Accept-Encoding, Accept');
      if (accept === 'text/markdown') {
        assert.match(response.headers.get('content-type') ?? '', /text\/markdown/);
        assert.equal(response.headers.has('content-length'), false);
        assert.equal(response.headers.has('etag'), false);
      }
    }
  });

  it('leaves non-HTML responses and wildcard cache keys intact', async () => {
    for (const [type, vary] of [['application/json', 'Origin'], ['text/html', '*']]) {
      const request = new Request('https://piyushmehta.com/example');
      const response = await markdown({ request, isPrerendered: false } as Parameters<typeof markdown>[0], async () => new Response('', {
        headers: { 'content-type': type, vary },
      }));
      assert.equal(response?.headers.get('Vary'), vary);
    }
  });
});

describe('custom feed XML', () => {
  it('escapes article data and query parameters in XML text and attributes', () => {
    assert.equal(escapeXml('https://example.com/image?a=1&b="<new>"'), 'https://example.com/image?a=1&amp;b=&quot;&lt;new&gt;&quot;');
    assert.equal(escapeXml("Piyush & 'Team'"), 'Piyush &amp; &apos;Team&apos;');
  });
});
