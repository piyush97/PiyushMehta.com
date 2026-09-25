import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { verifyRelease } from '../scripts/verify-release.mjs';

const roots: string[] = [];

function makeFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'piyush-release-'));
  roots.push(root);
  const client = join(root, 'dist', 'client');
  const server = join(root, 'dist', 'server');
  mkdirSync(join(client, 'search'), { recursive: true });
  mkdirSync(join(client, 'pagefind'), { recursive: true });
  mkdirSync(join(client, 'og'), { recursive: true });
  mkdirSync(server, { recursive: true });

  for (const file of [
    'index.html',
    'rss.xml',
    'sitemap.xml',
    'sitemap-index.xml',
    'robots.txt',
    '_redirects',
    'og/default.png',
    'pagefind/pagefind-entry.json',
    'pagefind/pagefind-ui.js',
    'pagefind/pagefind-ui.css',
  ]) {
    writeFileSync(join(client, file), 'fixture');
  }
  writeFileSync(join(client, '_headers'), [
    '/*',
    '  Content-Security-Policy: default-src \'self\';',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: DENY',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=()',
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/rss.xml',
    '  Cache-Control: public, max-age=3600',
    '/sitemap.xml',
    '  Cache-Control: public, max-age=3600',
    '/sitemap-index.xml',
    '  Cache-Control: public, max-age=3600',
    '/robots.txt',
    '  Cache-Control: public, max-age=86400',
    '/search/*',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '/pagefind/*',
    '  Cache-Control: public, max-age=3600, stale-while-revalidate=86400',
    '/og/*',
    '  Cache-Control: public, max-age=31536000, immutable',
  ].join('\n'));
  writeFileSync(join(client, 'search', 'index.html'), '<html></html>');
  writeFileSync(join(server, 'entry.mjs'), 'export default {};');
  writeFileSync(
    join(server, 'wrangler.json'),
    JSON.stringify({
      main: 'entry.mjs',
      assets: { binding: 'ASSETS', directory: '../client' },
    }),
  );
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('verifyRelease', () => {
  it('accepts a generated config resolved relative to dist/server', () => {
    const result = verifyRelease(makeFixture());
    assert.deepEqual(result.errors, []);
    assert.equal(result.ok, true);
  });

  it('rejects a root asset directory', () => {
    const root = makeFixture();
    const configPath = join(root, 'dist', 'server', 'wrangler.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.assets.directory = '../';
    writeFileSync(configPath, JSON.stringify(config));

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('dist/client')));
  });

  it('rejects a non-generated Worker entrypoint', () => {
    const root = makeFixture();
    const configPath = join(root, 'dist', 'server', 'wrangler.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.main = '@astrojs/cloudflare/entrypoints/server';
    writeFileSync(configPath, JSON.stringify(config));

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('main must resolve')));
  });

  it('rejects missing search output and server files in the client directory', () => {
    const root = makeFixture();
    rmSync(join(root, 'dist', 'client', 'pagefind', 'pagefind-entry.json'));
    writeFileSync(join(root, 'dist', 'client', 'entry.mjs'), 'leak');

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('pagefind-entry.json')));
    assert.ok(result.errors.some((error) => error.includes('Server-only output leaked')));
  });
});
