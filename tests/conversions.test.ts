import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  CONVERSION_EVENTS,
  POST_VIEW_REGISTRY_TTL_SECONDS,
  POST_VIEW_SLUGS_KEY,
  checkBasicPassword,
  dayKey,
  isClientEvent,
  postViewDayKey,
  readConversionTotals,
  readPostViewTotals,
  recordConversion,
  recordPostView,
} from '../src/utils/conversions';

function memoryStore() {
  const data = new Map<string, number>();
  const ttl = new Map<string, number>();
  const members = new Map<string, Set<string>>();
  return {
    data,
    ttl,
    members,
    async incr(key: string) {
      const n = (data.get(key) ?? 0) + 1;
      data.set(key, n);
      return n;
    },
    async expire(key: string, seconds: number) {
      ttl.set(key, seconds);
      return 1;
    },
    async mget(...keys: string[]) {
      return keys.map((k) => data.get(k) ?? null);
    },
    async sadd(key: string, member: string) {
      const set = members.get(key) ?? new Set<string>();
      set.add(member);
      members.set(key, set);
      return 1;
    },
    async smembers(key: string) {
      return [...(members.get(key) ?? [])];
    },
  };
}

const NOW = new Date('2026-10-28T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe('conversions', () => {
  it('only lets the browser report résumé and reading-path events', () => {
    assert.equal(isClientEvent('resume_download'), true);
    assert.equal(isClientEvent('reading_path_click'), true);
    assert.equal(isClientEvent('contact_sent'), false);
    assert.equal(isClientEvent('chat_question'), false);
    assert.equal(isClientEvent('anything'), false);
    assert.equal(isClientEvent(1), false);
  });

  it('keys by UTC day and sets expiry once', async () => {
    const store = memoryStore();
    await recordConversion(store, 'resume_download', NOW);
    await recordConversion(store, 'resume_download', NOW);
    const key = dayKey('resume_download', NOW);
    assert.equal(key, 'conv:resume_download:2026-10-28');
    assert.equal(store.data.get(key), 2);
    assert.equal(store.ttl.get(key), 60 * 86_400);
  });

  it('never throws when the store fails or is missing', async () => {
    const failing = { ...memoryStore(), incr: async () => Promise.reject(new Error('down')) };
    await recordConversion(failing, 'contact_sent', NOW);
    await recordConversion(null, 'contact_sent', NOW);
  });

  it('keys post views by slug and UTC day', () => {
    assert.equal(postViewDayKey('hello-world', NOW), 'conv:post_view:hello-world:2026-10-28');
  });

  it('records a post view and registers the slug', async () => {
    const store = memoryStore();
    await recordPostView(store, 'hello-world', NOW);
    assert.equal(store.data.get(postViewDayKey('hello-world', NOW)), 1);
    assert.equal(store.ttl.get(postViewDayKey('hello-world', NOW)), 60 * 86_400);
    assert.equal(store.ttl.get(POST_VIEW_SLUGS_KEY), POST_VIEW_REGISTRY_TTL_SECONDS);
    assert.deepEqual(await store.smembers(POST_VIEW_SLUGS_KEY), ['hello-world']);
  });

  it('never throws when the post view store fails or is missing', async () => {
    const failing = { ...memoryStore(), incr: async () => Promise.reject(new Error('down')) };
    await recordPostView(failing, 'hello-world', NOW);
    await recordPostView(null, 'hello-world', NOW);
  });

  it('returns no post totals when no slug has been registered', async () => {
    assert.deepEqual(await readPostViewTotals(memoryStore(), NOW), []);
  });

  it('splits totals into the last 28 days and the 28 before', async () => {
    const store = memoryStore();
    for (const d of [0, 27]) await recordConversion(store, 'chat_question', daysAgo(d));
    for (const d of [28, 55]) await recordConversion(store, 'chat_question', daysAgo(d));
    await recordConversion(store, 'chat_question', daysAgo(56));
    store.data.set(dayKey('contact_sent', NOW), Number.NaN);

    const totals = await readConversionTotals(store, NOW);
    assert.deepEqual(
      totals.map((t) => t.event),
      [...CONVERSION_EVENTS],
    );
    assert.deepEqual(
      totals.find((t) => t.event === 'chat_question'),
      { event: 'chat_question', current: 2, previous: 2 },
    );
    assert.deepEqual(
      totals.find((t) => t.event === 'contact_sent'),
      { event: 'contact_sent', current: 0, previous: 0 },
    );
  });

  it('propagates read failures so the page can say totals are unavailable', async () => {
    const failing = { ...memoryStore(), mget: async () => Promise.reject(new Error('down')) };
    await assert.rejects(readConversionTotals(failing, NOW));
  });

  it('checks the Basic password and ignores the username', async () => {
    const basic = (s: string) => `Basic ${btoa(s)}`;
    assert.equal(await checkBasicPassword(basic('any:s3cret:x'), 's3cret:x'), true);
    assert.equal(await checkBasicPassword(basic(':s3cret'), 's3cret'), true);
    assert.equal(await checkBasicPassword(basic('me:wrong'), 's3cret'), false);
    assert.equal(await checkBasicPassword('Basic !!!', 's3cret'), false);
    assert.equal(await checkBasicPassword('Bearer s3cret', 's3cret'), false);
    assert.equal(await checkBasicPassword(null, 's3cret'), false);
    assert.equal(await checkBasicPassword(basic('me:'), ''), false);
  });
});
