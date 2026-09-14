import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { generateCanonicalUrl } from '../src/utils/og-generator';
import { escapeXml } from '../src/utils/xml';

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

describe('custom feed XML', () => {
  it('escapes article data and query parameters in XML text and attributes', () => {
    assert.equal(escapeXml('https://example.com/image?a=1&b="<new>"'), 'https://example.com/image?a=1&amp;b=&quot;&lt;new&gt;&quot;');
    assert.equal(escapeXml("Piyush & 'Team'"), 'Piyush &amp; &apos;Team&apos;');
  });
});
