import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { isAllowedFormOrigin } from '../src/utils/request-security';

describe('isAllowedFormOrigin', () => {
  it('accepts the production origin', () => {
    assert.equal(
      isAllowedFormOrigin(
        new Request('https://piyushmehta.com/api/newsletter', {
          method: 'POST',
          headers: { origin: 'https://piyushmehta.com' },
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
