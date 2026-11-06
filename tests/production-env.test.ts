import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { REQUIRED_PRODUCTION_ENV, missingProductionEnv } from '../scripts/verify-production-env.mjs';

describe('deployment source guard', () => {
  const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

  it('blocks tracked, staged and untracked changes, plus Git failures', () => {
    for (const [tracked, staged, untracked, filesStatus, expected] of [
      [0, 0, '', 0, 0],
      [1, 0, '', 0, 1],
      [0, 1, '', 0, 1],
      [0, 0, 'public/fonts/font.woff2', 0, 1],
      [127, 0, '', 0, 127],
      [0, 0, '', 128, 128],
    ] as const) {
      const result = spawnSync('sh', ['-c', `
        git() {
          case "$1" in
            diff) if [ "$2" = '--cached' ]; then return "$STAGED"; fi; return "$TRACKED" ;;
            ls-files) printf '%s' "$UNTRACKED"; return "$FILES_STATUS" ;;
            *) return 127 ;;
          esac
        }
        ${scripts['check:clean']}
      `], { env: { ...process.env, TRACKED: String(tracked), STAGED: String(staged), UNTRACKED: untracked, FILES_STATUS: String(filesStatus) } });
      assert.equal(result.status, expected);
    }
  });

  it('checks source cleanliness before and after the build, before deployment', () => {
    assert.match(scripts.deploy, /^bun run check:clean && bun run build && bun run check:clean &&/);
  });
});

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
