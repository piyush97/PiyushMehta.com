#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_CLIENT_FILES = [
  'index.html',
  'rss.xml',
  'sitemap.xml',
  'sitemap-index.xml',
  'robots.txt',
  'search/index.html',
  'pagefind/pagefind-entry.json',
  'pagefind/pagefind-ui.js',
  'pagefind/pagefind-ui.css',
  '_headers',
  '_redirects',
  'og/default.png',
];

const SERVER_ONLY_CLIENT_PATHS = ['entry.mjs', 'wrangler.json', 'chunks', '.prerender'];

function addError(errors, message) {
  errors.push(message);
}

function isDirectory(path) {
  try {
    return readdirSync(path).length >= 0;
  } catch {
    return false;
  }
}

function verifyHeaders(clientDir, errors) {
  const headersPath = join(clientDir, '_headers');
  if (!existsSync(headersPath)) {
    addError(errors, 'Static asset headers file is missing: dist/client/_headers');
    return;
  }

  const headers = readFileSync(headersPath, 'utf8');
  for (const header of [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ]) {
    if (!headers.includes(header)) {
      addError(errors, `Static asset headers are missing ${header}`);
    }
  }

  if (!headers.includes('/_astro/*') || !headers.includes('immutable')) {
    addError(errors, 'Static asset headers are missing immutable /_astro/* caching');
  }
  for (const path of [
    '/rss.xml',
    '/sitemap.xml',
    '/sitemap-index.xml',
    '/robots.txt',
    '/search/*',
    '/pagefind/*',
    '/og/*',
  ]) {
    if (!headers.includes(path)) {
      addError(errors, `Static asset headers are missing the ${path} policy`);
    }
  }
}

export function verifyRelease(root = process.cwd()) {
  const errors = [];
  const distDir = resolve(root, 'dist');
  const clientDir = join(distDir, 'client');
  const serverDir = join(distDir, 'server');
  const configPath = join(serverDir, 'wrangler.json');
  const entryPath = join(serverDir, 'entry.mjs');

  if (!isDirectory(clientDir)) addError(errors, 'Static client output is missing: dist/client');
  if (!isDirectory(serverDir)) addError(errors, 'Worker output is missing: dist/server');
  if (!existsSync(configPath))
    addError(errors, 'Generated Wrangler config is missing: dist/server/wrangler.json');
  if (!existsSync(entryPath))
    addError(errors, 'Worker entrypoint is missing: dist/server/entry.mjs');

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      const generatedMain =
        typeof config.main === 'string' ? resolve(dirname(configPath), config.main) : null;
      const generatedAssets =
        config.assets && typeof config.assets.directory === 'string'
          ? resolve(dirname(configPath), config.assets.directory)
          : null;

      if (generatedMain !== entryPath) {
        addError(
          errors,
          `Generated Worker main must resolve to dist/server/entry.mjs (got ${generatedMain ?? 'missing'})`,
        );
      }
      if (generatedAssets !== clientDir) {
        addError(
          errors,
          `Generated assets directory must resolve to dist/client (got ${generatedAssets ?? 'missing'})`,
        );
      }
      if (config.assets?.binding !== 'ASSETS') {
        addError(errors, 'Generated assets binding must be ASSETS');
      }
    } catch (error) {
      addError(errors, `Generated Wrangler config is not valid JSON: ${error.message}`);
    }
  }

  for (const file of REQUIRED_CLIENT_FILES) {
    if (!existsSync(join(clientDir, file))) {
      addError(errors, `Required client artifact is missing: dist/client/${file}`);
    }
  }

  for (const path of SERVER_ONLY_CLIENT_PATHS) {
    if (existsSync(join(clientDir, path))) {
      addError(errors, `Server-only output leaked into dist/client: ${path}`);
    }
  }

  const relativeClient = relative(clientDir, serverDir);
  if (!relativeClient.startsWith('..')) {
    addError(errors, 'Worker output directory is not outside the public client directory');
  }

  verifyHeaders(clientDir, errors);

  return { ok: errors.length === 0, errors };
}

function main() {
  const result = verifyRelease(process.cwd());
  if (result.ok) {
    console.log('✅ Release artifacts verified');
    return;
  }

  for (const error of result.errors) console.error(`❌ ${error}`);
  process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) main();
