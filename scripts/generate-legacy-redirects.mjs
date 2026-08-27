#!/usr/bin/env node
/**
 * Generates 301 redirects for legacy blog URLs so historical shares (which used the original
 * mixed-case directory name, e.g. /blog/The-Silent-S-in-HTTPS) resolve instead of 404ing.
 *
 * Astro's content glob loader lowercases the collection `id`, so pages and /og/**.png cards are
 * only ever built at the lowercase path — the mixed-case URL a post was originally published and
 * shared under otherwise serves the 404 page, whose own og:image also 404s (a second cause of
 * "blank" link previews, independent of stale platform caches).
 *
 * Deliberately does NOT use a splat (`/blog/Foo/* -> ...`): several of these mixed-case
 * directories still exist under public/blog/<Name>/images/** as real, currently-served hero
 * image assets. A splat redirect would break every one of those images.
 *
 * Runs after `astro build` (see scripts/build.mjs) so it can append to the copy of
 * public/_redirects that Astro already placed in dist/client/.
 */

import { readdir, appendFile, access } from 'node:fs/promises';

const CONTENT_DIR = 'src/content/blog';
const REDIRECTS_FILE = 'dist/client/_redirects';
const MARKER_BEGIN = '# BEGIN generated: legacy blog slug redirects (scripts/generate-legacy-redirects.mjs)';
const MARKER_END = '# END generated: legacy blog slug redirects';

// Historical slugs that no longer exist as a src/content/blog directory at all (renames, typo
// fixes) but that still have live image assets under public/blog/<name>/ and may still be
// referenced by old shared links.
const LEGACY_ALIASES = {
  'Kubenetes-Docker': 'kubernetes-docker',
};

async function main() {
  const dirents = await readdir(CONTENT_DIR, { withFileTypes: true });
  const postDirs = dirents.filter((d) => d.isDirectory()).map((d) => d.name);

  const pairs = new Map();
  for (const name of postDirs) {
    if (name !== name.toLowerCase()) {
      pairs.set(name, name.toLowerCase());
    }
  }
  for (const [from, to] of Object.entries(LEGACY_ALIASES)) {
    pairs.set(from, to);
  }

  if (pairs.size === 0) {
    console.log('No legacy mixed-case blog slugs found — nothing to generate.');
    return;
  }

  const lines = [MARKER_BEGIN];
  for (const [from, to] of pairs) {
    lines.push(`/blog/${from} /blog/${to} 301`);
    lines.push(`/blog/${from}/ /blog/${to} 301`);
    lines.push(`/og/blog/${from}.png /og/blog/${to}.png 301`);
  }
  lines.push('/opengraph-image /og/default.png 301');
  lines.push('/twitter-image /og/default.png 301');
  lines.push(MARKER_END, '');

  try {
    await access(REDIRECTS_FILE);
  } catch {
    throw new Error(`${REDIRECTS_FILE} does not exist — did astro build run first?`);
  }

  await appendFile(REDIRECTS_FILE, `\n${lines.join('\n')}`);
  console.log(`Appended ${pairs.size} legacy blog redirect(s) to ${REDIRECTS_FILE}:`);
  for (const [from, to] of pairs) {
    console.log(`  /blog/${from} -> /blog/${to}`);
  }
}

main().catch((error) => {
  console.error('generate-legacy-redirects failed:', error);
  process.exit(1);
});
