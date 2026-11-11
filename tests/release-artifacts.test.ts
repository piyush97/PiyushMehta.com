import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { verifyRelease } from '../scripts/verify-release.mjs';

const roots: string[] = [];

function makeFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'piyush-release-'));
  roots.push(root);
  const client = join(root, 'dist', 'client');
  const server = join(root, 'dist', 'server');
  mkdirSync(join(client, 'ask'), { recursive: true });
  mkdirSync(join(client, 'search'), { recursive: true });
  mkdirSync(join(client, '.well-known'), { recursive: true });
  mkdirSync(join(client, 'pagefind'), { recursive: true });
  mkdirSync(join(client, 'og'), { recursive: true });
  mkdirSync(server, { recursive: true });

  for (const file of [
    'index.html',
    'ask/index.html',
    'rss.xml',
    'sitemap.xml',
    'robots.txt',
    '.well-known/security.txt',
    '_redirects',
    'og/default.png',
    'pagefind/pagefind-entry.json',
    'pagefind/pagefind-ui.js',
    'pagefind/pagefind-ui.css',
    'resume.pdf',
  ]) {
    writeFileSync(join(client, file), file === 'resume.pdf' ? '%PDF-fixture' : 'fixture');
  }
  writeFileSync(join(client, '.well-known/security.txt'), 'Contact: mailto:security@example.com\nExpires: 2099-01-01T00:00:00.000Z\n');
  writeFileSync(
    join(client, '_redirects'),
    ['/security.txt /.well-known/security.txt 301', '/newsletter /blog 301', '/newsletter/ /blog/ 301', '/og/newsletter.png /og/blog.png 301'].join('\n'),
  );
  writeFileSync(join(client, '_headers'), [
    '/*',
    '  Content-Security-Policy: default-src \'self\';',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: DENY',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Cross-Origin-Opener-Policy: same-origin',
    '  Cross-Origin-Resource-Policy: same-origin',
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
    '/.well-known/security.txt',
    '  Content-Type: text/plain; charset=utf-8',
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

  it('rejects a gzipped Worker bundle over the 2.5MB ceiling', () => {
    const root = makeFixture();
    writeFileSync(join(root, 'dist', 'server', 'chunk.mjs'), randomBytes(2.6 * 1024 * 1024));
    assert.ok(verifyRelease(root).errors.some((error) => error.includes('Gzipped Worker bundle')));
  });

  it('rejects missing or expired security discovery artifacts', () => {
    const root = makeFixture();
    const path = join(root, 'dist', 'client', '.well-known', 'security.txt');
    writeFileSync(path, 'Expires: 2000-01-01T00:00:00.000Z\n');
    assert.ok(verifyRelease(root).errors.some((error) => error.includes('expired security.txt')));
    rmSync(path);
    assert.ok(verifyRelease(root).errors.some((error) => error.includes('dist/client/.well-known/security.txt')));
  });

  it('rejects a missing legacy security.txt redirect', () => {
    const root = makeFixture();
    const path = join(root, 'dist', 'client', '_redirects');
    writeFileSync(path, readFileSync(path, 'utf8').replace('/security.txt /.well-known/security.txt 301', ''));
    assert.ok(verifyRelease(root).errors.some((error) => error.includes('security.txt redirect')));
  });

  it('keeps generated legacy redirects before wildcard rules', () => {
    const root = makeFixture();
    const post = join(root, 'src', 'content', 'blog', 'Old-Post');
    mkdirSync(post, { recursive: true });
    writeFileSync(join(post, 'index.mdx'), `---\ntags: ${JSON.stringify(Array.from({ length: 60 }, (_, i) => `Tag ${i}`))}\n---\n`);
    const path = join(root, 'dist', 'client', '_redirects');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n/writing/* /blog/:splat 301\n`);
    const script = fileURLToPath(new URL('../scripts/generate-legacy-redirects.mjs', import.meta.url));
    const run = () => spawnSync('bun', [script], { cwd: root, encoding: 'utf8' });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const redirects = readFileSync(path, 'utf8');
    assert.ok(redirects.indexOf('/blog/Old-Post ') < redirects.indexOf('/writing/*'));
    for (const rule of [
      '/blog/Old-Post /blog/old-post 301',
      '/blog/Old-Post/ /blog/old-post 301',
      '/og/blog/Old-Post.png /og/blog/old-post.png 301',
      '/blog/tag/tag-0 /blog?theme=Tag%200 301',
      '/blog/tag/tag-0/ /blog?theme=Tag%200 301',
      '/writing/* /blog/:splat 301',
    ]) assert.ok(redirects.includes(rule), rule);
    assert.equal(verifyRelease(root).ok, true);
    assert.equal(run().status, 0);
    assert.equal(readFileSync(path, 'utf8'), redirects);
  });

  it('counts all rules after a wildcard or placeholder toward the 100 dynamic limit', () => {
    const root = makeFixture();
    const path = join(root, 'dist', 'client', '_redirects');
    const base = readFileSync(path, 'utf8');
    const trailing = Array.from({ length: 99 }, (_, i) => `/old-${i} /blog 301`).join('\n');
    for (const source of ['/writing/*', '/writing/:slug']) {
      writeFileSync(path, `${base}\n# ignored /* :slug\n\n${source} /blog 301\n${trailing}`);
      assert.equal(verifyRelease(root).ok, true);
      writeFileSync(path, `${readFileSync(path, 'utf8')}\n/one-too-many /blog 301`);
      assert.ok(verifyRelease(root).errors.some((error) => error.includes('100 dynamic')));
    }
  });

  it('accepts 2,000 static redirects but rejects more', () => {
    const root = makeFixture();
    const path = join(root, 'dist', 'client', '_redirects');
    const base = readFileSync(path, 'utf8');
    const extra = Array.from({ length: 1996 }, (_, i) => `/old-${i} https://example.com/blog 301`).join('\n');
    writeFileSync(path, `${base}\n${extra}`);
    assert.equal(verifyRelease(root).ok, true);
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n/one-too-many /blog 301`);
    assert.ok(verifyRelease(root).errors.some((error) => error.includes('2000 static')));
  });

  it('rejects redirecting internal links but allows root and external URLs', () => {
    const root = makeFixture();
    const file = join(root, 'dist', 'client', 'index.html');
    writeFileSync(file, '<a href="/">Home</a><a href="//example.org/">External</a>');
    assert.equal(verifyRelease(root).ok, true);
    writeFileSync(file, '<a href="/blog/">Writing</a>');
    assert.ok(verifyRelease(root).errors.some((error) => error.includes('trailing slash')));
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
