#!/usr/bin/env node
/**
 * Build orchestrator for piyushmehta.com
 * Runs pipeline steps sequentially with proper error handling.
 * Usage: node scripts/build.mjs
 */

import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const SEP = '─'.repeat(50);

// A release must be built from a fresh output tree. Stale artifacts must never
// make a failed or partial build look deployable.
rmSync(resolve(process.cwd(), 'dist'), { recursive: true, force: true });

function step(name, cmd, opts = {}) {
  console.log(`\n${SEP}\n🔨 ${name}\n${SEP}`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
    console.log(`✅ ${name} — OK`);
  } catch (e) {
    console.error(`❌ ${name} — FAILED (exit ${e.status})`);
    if (opts.optional) {
      console.warn('   (optional — continuing)');
    } else {
      process.exit(1);
    }
  }
}

// 1. Type generation
step('Type generation', 'bunx varlock codegen');

// 2. Generate the published post manifest used by runtime APIs.
step('Published post manifest', 'node scripts/generate-post-manifest.mjs');

// 3. Migrate blog images to public/
step('Image migration', 'node scripts/migrate-images-to-public.mjs');

// 4. Copy the versioned resume asset before Astro copies public/ into dist/client.
step('Resume PDF asset', 'node scripts/copy-resume-pdf.mjs');

// 5. Main Astro build
step('Astro build', 'astro build', {
  env: { ...process.env, FORCE_COLOR: '1' },
});

// 6. Rescue legacy mixed-case blog URLs (must run after the Astro build copies public/_redirects
//    into dist/client/, and before deploy — see scripts/generate-legacy-redirects.mjs)
step('Legacy blog redirects', 'node scripts/generate-legacy-redirects.mjs');

// 7. Fail the build if any og:image/twitter:image/JSON-LD image reference is missing, wrong
//    size, or looks like the blank-fallback card — see scripts/verify-og.mjs
step('OG image coverage check', 'node scripts/verify-og.mjs');

step('Search discovery check', 'node scripts/verify-discovery.mjs');

// 8. Required post-build scripts
step('Pagefind search index', 'pagefind --site dist/client');
step('Release artifact checks', 'node scripts/verify-release.mjs');

console.log(`\n🎉 Build complete`);
