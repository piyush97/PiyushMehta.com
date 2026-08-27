#!/usr/bin/env node
/**
 * Post-build gate: walks the built site and asserts every og:image / twitter:image / JSON-LD
 * "image" URL that points at piyushmehta.com actually resolves to a real file in dist/client,
 * is a PNG, and — for /og/**.png cards specifically — is 1200x630 and large enough to not be the
 * hand-rolled blank-fallback SVG (which renders at ~4.4KB; real satori cards run 50-150KB).
 *
 * This is what would have caught every issue behind the "blank blue image" report: pages whose
 * og:image 404s, and — had it existed at the time — a build that silently regressed to the
 * invisible-text fallback for every card at once (same bug class as commit 6406c08).
 *
 * Runs as a required (non-optional) step in scripts/build.mjs, after the Astro build and the
 * legacy-redirect generator, so a violation fails `bun run build` before a bad deploy ships.
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const CLIENT_DIR = path.resolve('dist/client');
const SITE_ORIGIN = 'https://piyushmehta.com';
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OG_CARD_MIN_BYTES = 20_000; // real cards are 50-150KB; the blank SVG fallback is ~4.4KB
const OG_CARD_EXPECT = { width: 1200, height: 630 };

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

function extractImageUrls(html) {
  const urls = new Set();
  const metaPatterns = [
    /<meta\s+property="og:image(?::(?:url|secure_url))?"\s+content="([^"]+)"/g,
    /<meta\s+name="twitter:image(?::src)?"\s+content="([^"]+)"/g,
  ];
  for (const re of metaPatterns) {
    for (const m of html.matchAll(re)) urls.add(m[1]);
  }
  // JSON-LD "image": "https://..." (catches e.g. a hardcoded-but-missing profile photo)
  for (const m of html.matchAll(/"image"\s*:\s*"(https:\/\/[^"]+)"/g)) urls.add(m[1]);
  return [...urls];
}

async function checkImageUrl(url) {
  if (!url.startsWith(SITE_ORIGIN)) {
    return { url, ok: true, skipped: 'external' };
  }

  let pathname;
  try {
    pathname = new URL(url).pathname; // deliberately strips the ?v= cache-bust query
  } catch {
    return { url, ok: false, why: 'not a valid URL' };
  }

  const file = path.join(CLIENT_DIR, decodeURIComponent(pathname));
  let buf;
  try {
    buf = await readFile(file);
  } catch {
    return { url, ok: false, why: `no file at dist/client${pathname}` };
  }

  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) {
    return { url, ok: false, why: `not a PNG (dist/client${pathname})` };
  }

  const isOgCard = pathname.startsWith('/og/');
  if (isOgCard) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width !== OG_CARD_EXPECT.width || height !== OG_CARD_EXPECT.height) {
      return { url, ok: false, why: `${width}x${height}, expected 1200x630 (dist/client${pathname})` };
    }
    if (buf.byteLength < OG_CARD_MIN_BYTES) {
      return {
        url,
        ok: false,
        why: `only ${buf.byteLength} bytes — looks like the blank fallback card (dist/client${pathname})`,
      };
    }
  }

  return { url, ok: true, bytes: buf.byteLength };
}

/**
 * Sanity-check the legacy-redirects block that scripts/generate-legacy-redirects.mjs appends to
 * dist/client/_redirects. Catches the block going missing (script didn't run / ran before the
 * Astro build overwrote _redirects) rather than silently shipping 404s for old shared links.
 */
async function checkRedirectsFile() {
  const file = path.join(CLIENT_DIR, '_redirects');
  let text;
  try {
    text = await readFile(file, 'utf-8');
  } catch {
    return [`dist/client/_redirects does not exist`];
  }

  const problems = [];
  if (!text.includes('BEGIN generated: legacy blog slug redirects')) {
    problems.push(
      'dist/client/_redirects has no generated legacy-redirect block — did ' +
        'scripts/generate-legacy-redirects.mjs run after the Astro build?',
    );
  }
  for (const required of ['/opengraph-image /og/default.png 301', '/twitter-image /og/default.png 301']) {
    if (!text.includes(required)) {
      problems.push(`dist/client/_redirects is missing required rule: ${required}`);
    }
  }
  return problems;
}

async function main() {
  const redirectProblems = await checkRedirectsFile();
  if (redirectProblems.length > 0) {
    console.error(`\n❌ ${redirectProblems.length} problem(s) with dist/client/_redirects:\n`);
    for (const p of redirectProblems) console.error(`  ${p}`);
    process.exit(1);
  }

  const pageToUrls = new Map();

  for await (const file of walk(CLIENT_DIR)) {
    const html = await readFile(file, 'utf-8');
    const urls = extractImageUrls(html);
    if (urls.length > 0) {
      pageToUrls.set(path.relative(CLIENT_DIR, file), urls);
    }
  }

  const checked = new Map(); // url -> result, dedup across pages sharing a card
  const failures = []; // { page, url, why }

  for (const [page, urls] of pageToUrls) {
    for (const url of urls) {
      if (!checked.has(url)) {
        checked.set(url, await checkImageUrl(url));
      }
      const result = checked.get(url);
      if (!result.ok) {
        failures.push({ page, url, why: result.why });
      }
    }
  }

  const ogCardResults = [...checked.values()].filter((r) => r.ok && !r.skipped && r.bytes);
  console.log(`Checked ${checked.size} distinct image URL(s) across ${pageToUrls.size} page(s).`);

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} broken social-card image reference(s):\n`);
    for (const f of failures) {
      console.error(`  ${f.page}\n    -> ${f.url}\n    ${f.why}\n`);
    }
    process.exit(1);
  }

  console.log(`✅ All social-card / OG image references resolve (${ogCardResults.length} card file(s) checked).`);
}

main().catch((error) => {
  console.error('verify-og failed:', error);
  process.exit(1);
});
