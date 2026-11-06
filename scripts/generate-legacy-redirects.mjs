#!/usr/bin/env bun
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
 * Runs after `astro build` (see scripts/build.mjs) so it can insert exact redirects before any
 * wildcard rules in the copy of public/_redirects that Astro placed in dist/client/.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';

const CONTENT_DIR = 'src/content/blog';
const REDIRECTS_FILE = 'dist/client/_redirects';
const MARKER_BEGIN =
  '# BEGIN generated: legacy blog slug redirects (scripts/generate-legacy-redirects.mjs)';
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
  const tags = new Map();
  for (const name of postDirs) {
    let source;
    try {
      source = await readFile(`${CONTENT_DIR}/${name}/index.mdx`, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      try {
        source = await readFile(`${CONTENT_DIR}/${name}/index.md`, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        continue;
      }
    }
    const data = Bun.YAML.parse(source.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '') ?? {};
    if (!data.draft)
      for (const tag of data.tags ?? []) tags.set(tag.toLowerCase().replace(/\s+/g, '-'), tag);
    if (name !== name.toLowerCase()) {
      pairs.set(name, name.toLowerCase());
    }
  }
  for (const [from, to] of Object.entries(LEGACY_ALIASES)) {
    pairs.set(from, to);
  }

  if (pairs.size === 0 && tags.size === 0) {
    console.log('No legacy mixed-case blog slugs found — nothing to generate.');
    return;
  }

  const lines = [MARKER_BEGIN];
  for (const [from, to] of pairs) {
    lines.push(`/blog/${from} /blog/${to} 301`);
    lines.push(`/blog/${from}/ /blog/${to} 301`);
    lines.push(`/og/blog/${from}.png /og/blog/${to}.png 301`);
  }
  for (const [slug, tag] of tags) {
    const path = slug.split('/').map(encodeURIComponent).join('/');
    lines.push(`/blog/tag/${path} /blog?theme=${encodeURIComponent(tag)} 301`);
    lines.push(`/blog/tag/${path}/ /blog?theme=${encodeURIComponent(tag)} 301`);
  }
  lines.push('/opengraph-image /og/default.png 301');
  lines.push('/twitter-image /og/default.png 301');
  lines.push(MARKER_END, '');

  // Read the existing (Astro-built) file and write back its content plus the generated block in
  // one operation, rather than a separate existence check followed by an append — a
  // check-then-act pair on the same path is a TOCTOU race, and appendFile's default flag would
  // silently create the file if missing anyway, masking a build-order mistake instead of erroring.
  let existing;
  try {
    existing = await readFile(REDIRECTS_FILE, 'utf-8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`${REDIRECTS_FILE} does not exist — did astro build run first?`);
    }
    throw error;
  }

  const start = existing.indexOf(MARKER_BEGIN);
  if (start !== -1) {
    const end = existing.indexOf(MARKER_END, start);
    if (end === -1) throw new Error('Incomplete generated redirect block');
    existing = existing.slice(0, start) + existing.slice(end + MARKER_END.length);
  }
  // Cloudflare counts every rule after the first wildcard/placeholder as dynamic (limit 100).
  const existingLines = existing
    .trim()
    .split('\n')
    .filter((line) => line.trim());
  const firstDynamicRule = existingLines.findIndex((line) => {
    const from = line.trim().split(/\s+/)[0];
    return !from.startsWith('#') && /\*|:[A-Za-z]\w*/.test(from);
  });
  existingLines.splice(firstDynamicRule < 0 ? existingLines.length : firstDynamicRule, 0, ...lines);
  await writeFile(REDIRECTS_FILE, `${existingLines.join('\n')}\n`);
  console.log(`Generated ${pairs.size} legacy blog redirect(s) in ${REDIRECTS_FILE}:`);
  for (const [from, to] of pairs) {
    console.log(`  /blog/${from} -> /blog/${to}`);
  }
}

main().catch((error) => {
  console.error('generate-legacy-redirects failed:', error);
  process.exit(1);
});
