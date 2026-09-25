#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(PROJECT_ROOT, 'src', 'content', 'blog');
const OUTPUT_PATH = join(PROJECT_ROOT, 'src', 'data', 'published-post-slugs.json');

function isDraft(mdxPath) {
  const source = readFileSync(mdxPath, 'utf8');
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/);
  return /^draft\s*:\s*true\s*$/m.test(frontmatter?.[1] ?? '');
}

function buildManifest() {
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const mdxPath = join(CONTENT_DIR, entry.name, 'index.mdx');
      if (!existsSync(mdxPath) || isDraft(mdxPath)) return [];
      return [entry.name];
    })
    .sort((left, right) => left.localeCompare(right));
}

const slugs = buildManifest();
const manifest = `${JSON.stringify(slugs, null, 2)}\n`;
const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, 'utf8') : '';
  if (current !== manifest) {
    console.error('Published post manifest is stale. Run `bun run generate:posts`.');
    process.exitCode = 1;
  } else {
    console.log(`✅ Published post manifest is current (${slugs.length} posts)`);
  }
} else if (!existsSync(OUTPUT_PATH) || readFileSync(OUTPUT_PATH, 'utf8') !== manifest) {
  writeFileSync(OUTPUT_PATH, manifest);
  console.log(`✅ Wrote published post manifest (${slugs.length} posts)`);
} else {
  console.log(`✅ Published post manifest is current (${slugs.length} posts)`);
}
