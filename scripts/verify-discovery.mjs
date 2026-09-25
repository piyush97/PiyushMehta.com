#!/usr/bin/env node
/** Check crawler-facing URLs against the actual prerendered pages before deployment. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const client = path.resolve('dist/client');
const origin = 'https://piyushmehta.com';
const read = (file) => readFile(path.join(client, file), 'utf8');
const sitemap = await read('sitemap.xml');
const feed = await read('rss.xml');
const robots = await read('robots.txt');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const feedLinks = [...feed.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map(
  (match) => match[1],
);

assert(urls.length > 0, 'The sitemap must include pages');
assert(feedLinks.length > 0, 'The RSS feed must include articles');
assert.equal(urls.length, new Set(urls).size, 'Duplicate sitemap URLs');
assert.equal(feedLinks.length, new Set(feedLinks).size, 'Duplicate RSS links');
assert(
  robots.includes(`Sitemap: ${origin}/sitemap.xml`),
  'robots.txt must advertise the canonical sitemap',
);
assert(!robots.includes(`${origin}//`), 'Malformed discovery URL in robots.txt');

for (const route of ['/services', '/resume', '/react-developer']) {
  assert(urls.includes(`${origin}${route}`), `${route} must be discoverable in the sitemap`);
}

for (const href of urls) {
  const url = new URL(href);
  assert.equal(url.origin, origin, `Unexpected host: ${href}`);
  assert(!url.search && !url.hash && !url.pathname.includes('//'), `Non-canonical URL: ${href}`);
  const file =
    url.pathname === '/'
      ? 'index.html'
      : `${decodeURIComponent(url.pathname).replace(/^\//, '')}/index.html`;
  const html = await read(file);
  assert(
    !/<meta[^>]+name="(?:robots|googlebot)"[^>]+content="[^"]*\bnoindex\b/i.test(html),
    `Sitemap includes noindex page: ${href}`,
  );
  assert(!/<meta[^>]+http-equiv="refresh"/i.test(html), `Sitemap includes a redirect: ${href}`);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  assert.equal(canonical?.[1], href, `Sitemap and HTML canonical disagree: ${href}`);
  if (url.pathname.startsWith('/blog/')) {
    const lastmod = sitemap.match(
      new RegExp(
        `<loc>${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc><lastmod>([^<]+)</lastmod>`,
      ),
    )?.[1];
    const modified = html.match(/"dateModified":"([^"]+)"/)?.[1];
    assert(lastmod && modified, `Missing article modification date: ${href}`);
    assert.equal(lastmod, modified, `Sitemap and article modified dates disagree: ${href}`);
  }
}
for (const link of feedLinks) {
  assert(urls.includes(link), `RSS link is not a canonical published page: ${link}`);
}
const articleUrls = urls.filter((url) => new URL(url).pathname.startsWith('/blog/'));
assert.deepEqual(
  new Set(feedLinks),
  new Set(articleUrls),
  'RSS and sitemap article coverage must agree',
);
console.log(
  `Discovery verified: ${urls.length} canonical pages, ${feedLinks.length} RSS articles, and robots.txt.`,
);
