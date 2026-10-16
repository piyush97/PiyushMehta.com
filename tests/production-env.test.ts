import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { REQUIRED_PRODUCTION_ENV, missingProductionEnv } from '../scripts/verify-production-env.mjs';

const ALL = Object.fromEntries(REQUIRED_PRODUCTION_ENV.map((n) => [n, 'x']));

describe('production environment preflight', () => {
  it('reports only missing required binding names, never values', () => {
    assert.deepEqual(
      missingProductionEnv({ ...ALL, RESEND_API_KEY: '   ' }),
      ['RESEND_API_KEY'],
    );
  });

  it('passes when all required bindings are present', () => {
    assert.deepEqual(missingProductionEnv(ALL), []);
  });

  it('requires the chat bindings', () => {
    assert.deepEqual(missingProductionEnv({}).filter((n) => /TURNSTILE|CHAT_/.test(n)), [
      'TURNSTILE_SECRET_KEY',
      'PUBLIC_TURNSTILE_SITE_KEY',
      'CHAT_SESSION_SECRET',
    ]);
  });
});
