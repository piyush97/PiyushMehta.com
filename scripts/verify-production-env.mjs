#!/usr/bin/env node

/**
 * Fail before deployment when the runtime API bindings are not configured.
 *
 * The build itself is intentionally credential-free so it can run in forks and
 * previews, but contact and reactions both fail closed at runtime when Upstash
 * or Resend is missing. Requiring the names at deploy time prevents shipping a
 * green build whose public APIs are all 503.
 */

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_PRODUCTION_ENV = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'RESEND_API_KEY',
];

export function missingProductionEnv(env = process.env) {
  return REQUIRED_PRODUCTION_ENV.filter((name) => !env[name]?.trim());
}

function main() {
  const missing = missingProductionEnv();
  if (missing.length > 0) {
    console.error(`Missing required production bindings: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Production bindings present (${REQUIRED_PRODUCTION_ENV.length} required names)`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) main();
