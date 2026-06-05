#!/usr/bin/env node
/**
 * Build orchestrator for piyushmehta.com
 * Runs pipeline steps sequentially with proper error handling.
 * Usage: node scripts/build.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

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
step('Type generation', 'bunx varlock typegen');

// 2. Migrate blog images to public/
step('Image migration', 'node scripts/migrate-images-to-public.mjs');

// 3. Main Astro build
step('Astro build', 'astro build', {
  env: { ...process.env, FORCE_COLOR: '1' },
});

// 4. Post-build scripts (pagefind, sitemap, RSS)
step('Pagefind search index', 'node scripts/run-pagefind.mjs', { optional: true });
step('Sitemap generation', 'node scripts/generate-enhanced-sitemap.mjs', { optional: true });
step('RSS generation', 'node scripts/generate-static-rss.mjs', { optional: true });

console.log(`\n🎉 Build complete`);
