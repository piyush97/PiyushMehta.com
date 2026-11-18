import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { POST, normalizeReport } from '../src/pages/api/csp-report';

const call = (request: Request) =>
  (POST as (context: { request: Request }) => Promise<Response>)({ request });

const report = (body: string, contentType = 'application/csp-report') =>
  call(
    new Request('https://piyushmehta.com/api/csp-report', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body,
    }),
  );

const captureWarnings = () => {
  const lines: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    lines.push(args.map((arg) => String(arg)).join(' '));
  };
  return {
    lines,
    restore: () => {
      console.warn = original;
    },
  };
};

describe('csp-report collector', () => {
  it('accepts a legacy report and answers 204', async () => {
    const warnings = captureWarnings();
    try {
      const response = await report(
        JSON.stringify({
          'csp-report': {
            'effective-directive': 'script-src',
            'blocked-uri': 'inline',
            'document-uri': 'https://piyushmehta.com/legacy',
            disposition: 'report',
          },
        }),
      );
      assert.equal(response.status, 204);
      assert.equal(warnings.lines.length, 1);
    } finally {
      warnings.restore();
    }
  });

  it('accepts a Reporting API batch and logs each report', async () => {
    const warnings = captureWarnings();
    try {
      const response = await report(
        JSON.stringify([
          {
            type: 'csp-violation',
            body: {
              'effective-directive': 'img-src',
              'blocked-uri': 'https://cdn.example.net/pixel.png?uid=1',
              'document-uri': 'https://piyushmehta.com/batch-one',
            },
          },
          {
            type: 'csp-violation',
            body: {
              'effective-directive': 'connect-src',
              'blocked-uri': 'https://api.example.net/v1',
              'document-uri': 'https://piyushmehta.com/batch-two',
            },
          },
        ]),
        'application/reports+json',
      );
      assert.equal(response.status, 204);
      assert.equal(warnings.lines.length, 2);
    } finally {
      warnings.restore();
    }
  });

  it('logs a repeated violation only once', async () => {
    const payload = JSON.stringify({
      'csp-report': {
        'effective-directive': 'style-src',
        'blocked-uri': 'inline',
        'document-uri': 'https://piyushmehta.com/repeated',
      },
    });
    const warnings = captureWarnings();
    try {
      assert.equal((await report(payload)).status, 204);
      assert.equal((await report(payload)).status, 204);
      assert.equal(warnings.lines.length, 1);
    } finally {
      warnings.restore();
    }
  });

  it('drops oversized bodies without logging', async () => {
    const warnings = captureWarnings();
    try {
      const response = await call(
        new Request('https://piyushmehta.com/api/csp-report', {
          method: 'POST',
          headers: { 'content-type': 'application/csp-report', 'content-length': '9000' },
          body: JSON.stringify({
            'csp-report': {
              'effective-directive': 'script-src',
              'blocked-uri': 'inline',
              'document-uri': 'https://piyushmehta.com/oversized',
            },
          }),
        }),
      );
      assert.equal(response.status, 204);
      assert.equal(warnings.lines.length, 0);
    } finally {
      warnings.restore();
    }
  });

  it('ignores malformed JSON', async () => {
    const warnings = captureWarnings();
    try {
      const response = await report('{not json');
      assert.equal(response.status, 204);
      assert.equal(warnings.lines.length, 0);
    } finally {
      warnings.restore();
    }
  });

  it('accepts reports without an Origin header', async () => {
    const warnings = captureWarnings();
    try {
      const response = await report(
        JSON.stringify({
          'csp-report': {
            'effective-directive': 'frame-src',
            'blocked-uri': 'https://evil.example/embed',
            'document-uri': 'https://piyushmehta.com/no-origin',
          },
        }),
      );
      assert.equal(response.status, 204);
      assert.equal(warnings.lines.length, 1);
    } finally {
      warnings.restore();
    }
  });

  it('strips queries, fragments and IPs from logged fields', () => {
    const entry = normalizeReport({
      'effective-directive': 'script-src',
      'blocked-uri': 'https://cdn.example.net/app.js?token=secret#frag',
      'document-uri': 'https://piyushmehta.com/blog?ref=newsletter#top',
      'source-file': 'https://piyushmehta.com/scripts/app.js?v=2',
      'line-number': 42,
      disposition: 'enforce',
      'script-sample': 'alert(1)',
      'cf-connecting-ip': '203.0.113.7',
    });

    assert.ok(entry);
    assert.equal(entry.document, 'https://piyushmehta.com/blog');
    assert.equal(entry.blocked, 'https://cdn.example.net/app.js');
    assert.equal(entry.sourceFile, 'https://piyushmehta.com/scripts/app.js');
    assert.equal(entry.lineNumber, 42);
    assert.equal(entry.disposition, 'enforce');

    const logged = JSON.stringify(entry);
    assert.ok(!logged.includes('?'));
    assert.ok(!logged.includes('ref=newsletter'));
    assert.ok(!logged.includes('203.0.113.7'));
    assert.ok(!logged.includes('alert(1)'));
  });
});
