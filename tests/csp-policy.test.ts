import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { securityHeaders } from '../src/utils/request-security';

const staticHeaders = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');

function blockFor(heading: string): string[] {
  const lines = staticHeaders.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  assert.notEqual(start, -1, `public/_headers is missing the ${heading} block`);
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || !/^\s/.test(line)) break;
    body.push(line.trim());
  }
  return body;
}

function headerIn(body: string[], name: string): string {
  const line = body.find((entry) => entry.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line ? line.slice(line.indexOf(':') + 1).trim() : '';
}

function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...sources] = part.split(/\s+/);
        return [name, sources.sort()];
      }),
  );
}

const codeCsp = securityHeaders()['Content-Security-Policy'] ?? '';
const siteCsp = headerIn(blockFor('/*'), 'Content-Security-Policy');
const embedCsp = headerIn(blockFor('/lab/embed/*'), 'Content-Security-Policy');

describe('static CSP parity', () => {
  it('serves the same policy from public/_headers as the middleware emits', () => {
    assert.ok(siteCsp, 'public/_headers /* block has no Content-Security-Policy');
    assert.deepEqual(directives(siteCsp), directives(codeCsp));
  });

  it('keeps the /lab/embed/* copy identical except for frame-ancestors', () => {
    const embed = directives(embedCsp);
    assert.equal(embed['frame-ancestors']?.join(' '), '*');
    assert.deepEqual({ ...embed, 'frame-ancestors': directives(codeCsp)['frame-ancestors'] }, directives(codeCsp));
  });

  it('unsets X-Frame-Options for embed pages, matching the middleware rewrite', () => {
    assert.ok(blockFor('/lab/embed/*').includes('! X-Frame-Options'));
  });

  it('keeps unsafe-eval out of every enforced policy', () => {
    for (const policy of [siteCsp, embedCsp, codeCsp]) {
      assert.ok(!/unsafe-eval/.test(policy), `unsafe-eval reappeared in: ${policy.slice(0, 80)}`);
    }
  });

  it('reports prerendered pages to the same endpoint with a stricter script-src', () => {
    const body = blockFor('/*');
    assert.equal(headerIn(body, 'Reporting-Endpoints'), 'csp="/api/csp-report"');
    const reportOnly = directives(headerIn(body, 'Content-Security-Policy-Report-Only'));
    assert.deepEqual(reportOnly['script-src'], ['\'self\'', 'https://challenges.cloudflare.com']);
    assert.equal(reportOnly['report-uri']?.join(' '), '/api/csp-report');
  });
});
