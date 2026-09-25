import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { missingProductionEnv } from '../scripts/verify-production-env.mjs';

describe('production environment preflight', () => {
  it('reports only missing required binding names, never values', () => {
    assert.deepEqual(
      missingProductionEnv({
        UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'token',
        RESEND_API_KEY: '   ',
      }),
      ['RESEND_API_KEY'],
    );
  });

  it('passes when all required bindings are present', () => {
    assert.deepEqual(
      missingProductionEnv({
        UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'token',
        RESEND_API_KEY: 're_example',
      }),
      [],
    );
  });
});
