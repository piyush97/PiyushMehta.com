#!/usr/bin/env node
/**
 * Copy the versioned resume PDF into Astro's public directory.
 *
 * The source asset is committed so Cloudflare Workers Builds does not need a
 * headless browser just to produce a static download.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '..', 'src', 'assets', 'resume.pdf');
const output = resolve(import.meta.dirname, '..', 'public', 'resume.pdf');

if (!existsSync(source)) {
  throw new Error(`Missing versioned resume asset: ${source}`);
}

const contents = readFileSync(source);
const header = contents.subarray(0, 5).toString();
if (header !== '%PDF-') {
  throw new Error(`Invalid resume PDF header: ${header}`);
}
if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(contents.toString('latin1'))) {
  throw new Error(
    'Resume PDF contains a non-production link annotation. Regenerate with PUBLIC_BASE_URL set.',
  );
}

mkdirSync(resolve(import.meta.dirname, '..', 'public'), { recursive: true });
copyFileSync(source, output);
console.log(`[copy-resume-pdf] ✓ Copied ${source} -> ${output}`);
