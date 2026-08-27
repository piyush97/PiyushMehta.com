#!/usr/bin/env node
/**
 * Build orchestrator for piyushmehta.com
 * Runs pipeline steps sequentially with proper error handling.
 * Usage: node scripts/build.mjs
 */

import { execSync } from 'node:child_process';

const SEP = '─'.repeat(50);

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

// 2. Migrate blog images to public/
step('Image migration', 'node scripts/migrate-images-to-public.mjs');

// 3. Main Astro build
step('Astro build', 'astro build', {
  env: { ...process.env, FORCE_COLOR: '1' },
});

// 4. Rescue legacy mixed-case blog URLs (must run after the Astro build copies public/_redirects
//    into dist/client/, and before deploy — see scripts/generate-legacy-redirects.mjs)
step('Legacy blog redirects', 'node scripts/generate-legacy-redirects.mjs');

// 5. Fail the build if any og:image/twitter:image/JSON-LD image reference is missing, wrong
//    size, or looks like the blank-fallback card — see scripts/verify-og.mjs
step('OG image coverage check', 'node scripts/verify-og.mjs');

// 6. Post-build scripts (pagefind, resume PDF)
step('Pagefind search index', 'pagefind --site dist/client', { optional: true });

// 7. Optional: generate resume PDF
step('Resume PDF', 'node scripts/generate-resume-pdf.mjs', { optional: true });

console.log(`\n🎉 Build complete`);
