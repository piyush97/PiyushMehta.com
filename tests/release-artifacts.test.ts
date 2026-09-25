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
    'resume.pdf',
  ]) {
    writeFileSync(join(client, file), file === 'resume.pdf' ? '%PDF-fixture' : 'fixture');
  }
  writeFileSync(
    join(client, '_redirects'),
    ['/newsletter /blog 301', '/newsletter/ /blog/ 301', '/og/newsletter.png /og/blog.png 301'].join('\n'),
  );
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
    '/resume.pdf',
    '  Content-Type: application/pdf',
    '  Cache-Control: public, max-age=3600, stale-while-revalidate=86400',
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
    rmSync(join(root, 'dist', 'client', 'resume.pdf'));
    writeFileSync(join(root, 'dist', 'client', 'entry.mjs'), 'leak');

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('pagefind-entry.json')));
    assert.ok(result.errors.some((error) => error.includes('resume.pdf')));
    assert.ok(result.errors.some((error) => error.includes('Server-only output leaked')));
  });

  it('rejects client source maps in the public output', () => {
    const root = makeFixture();
    writeFileSync(join(root, 'dist', 'client', 'app.js.map'), '{}');

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('source map')));
  });

  it('rejects resume PDFs with non-production link annotations', () => {
    const root = makeFixture();
    writeFileSync(
      join(root, 'dist', 'client', 'resume.pdf'),
      '%PDF-1.4 /URI (http://localhost:4321/projects/)',
    );

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('non-production link annotation')));
  });

  it('rejects retired newsletter artifacts and sitemap entries', () => {
    const root = makeFixture();
    mkdirSync(join(root, 'dist', 'client', 'newsletter'), { recursive: true });
    writeFileSync(join(root, 'dist', 'client', 'newsletter', 'index.html'), 'retired');
    writeFileSync(join(root, 'dist', 'client', 'sitemap.xml'), '<urlset><loc>/newsletter</loc></urlset>');

    const result = verifyRelease(root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('newsletter/index.html')));
    assert.ok(result.errors.some((error) => error.includes('sitemap.xml')));
  });
});
