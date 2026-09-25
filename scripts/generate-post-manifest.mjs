#!/usr/bin/env node

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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
      // Keep the runtime allowlist aligned with the content loader, which accepts both extensions.
      const postPath = ['index.mdx', 'index.md']
        .map((fileName) => join(CONTENT_DIR, entry.name, fileName))
        .find((filePath) => existsSync(filePath));
      if (!postPath || isDraft(postPath)) return [];
      return [entry.name];
    })
    .sort((left, right) => left.localeCompare(right));
}

function readCurrentManifest() {
  try {
    return readFileSync(OUTPUT_PATH, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function writeManifestAtomically(manifest) {
  const tempDir = mkdtempSync(join(dirname(OUTPUT_PATH), '.published-post-manifest-'));
  const tempPath = join(tempDir, 'published-post-slugs.json');

  try {
    writeFileSync(tempPath, manifest, { flag: 'wx' });
    renameSync(tempPath, OUTPUT_PATH);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

const slugs = buildManifest();
const manifest = `${JSON.stringify(slugs, null, 2)}\n`;
const checkOnly = process.argv.includes('--check');
const current = readCurrentManifest();

if (checkOnly) {
  if (current !== manifest) {
    console.error('Published post manifest is stale. Run `bun run generate:posts`.');
    process.exitCode = 1;
  } else {
    console.log(`✅ Published post manifest is current (${slugs.length} posts)`);
  }
} else if (current !== manifest) {
  writeManifestAtomically(manifest);
  console.log(`✅ Wrote published post manifest (${slugs.length} posts)`);
} else {
  console.log(`✅ Published post manifest is current (${slugs.length} posts)`);
}
