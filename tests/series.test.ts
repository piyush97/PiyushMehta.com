import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { getSeriesContext, getSeriesPosts, type SeriesPostInput } from '../src/utils/series';

const post = (
  id: string,
  date: string,
  extra: Partial<SeriesPostInput['data']> = {},
): SeriesPostInput => ({ id, data: { title: id.toUpperCase(), date: new Date(date), ...extra } });

const posts = [
  post('c/index', '2026-03-01', { series: 'S', seriesOrder: 3 }),
  post('a/index', '2026-05-01', { series: 'S', seriesOrder: 1 }),
  post('b/index', '2026-04-01', { series: 'S', seriesOrder: 2 }),
  post('draft/index', '2026-01-01', { series: 'S', seriesOrder: 2, draft: true }),
  post('other/index', '2026-01-01', { series: 'T', seriesOrder: 1 }),
  post('plain/index', '2026-01-01'),
];

describe('series helpers', () => {
  it('orders by seriesOrder and skips drafts and other series', () => {
    assert.deepEqual(
      getSeriesPosts(posts, 'S').map((entry) => entry.slug),
      ['a', 'b', 'c'],
    );
  });

  it('falls back to date, then slug, for unordered posts placed after ordered ones', () => {
    const mixed = [
      post('z/index', '2026-01-01', { series: 'S' }),
      post('y/index', '2026-01-01', { series: 'S' }),
      post('x/index', '2026-02-01', { series: 'S' }),
      post('first/index', '2026-09-01', { series: 'S', seriesOrder: 1 }),
    ];
    assert.deepEqual(
      getSeriesPosts(mixed, 'S').map((entry) => entry.slug),
      ['first', 'y', 'z', 'x'],
    );
  });

  it('returns position, neighbours and totals for a middle post', () => {
    const context = getSeriesContext(posts, 'b');
    assert.ok(context);
    assert.equal(context.name, 'S');
    assert.equal(context.index, 2);
    assert.equal(context.total, 3);
    assert.equal(context.prev?.slug, 'a');
    assert.equal(context.next?.slug, 'c');
  });

  it('has no prev on the first post and no next on the last', () => {
    assert.equal(getSeriesContext(posts, 'a')?.prev, null);
    assert.equal(getSeriesContext(posts, 'c')?.next, null);
  });

  it('returns null for drafts, unknown slugs and posts outside a series', () => {
    assert.equal(getSeriesContext(posts, 'draft'), null);
    assert.equal(getSeriesContext(posts, 'missing'), null);
    assert.equal(getSeriesContext(posts, 'plain'), null);
  });

  it('strips /index and extensions from collection ids', () => {
    const flat = [post('one.mdx', '2026-01-01', { series: 'S', seriesOrder: 1 })];
    assert.equal(getSeriesContext(flat, 'one')?.posts[0]?.slug, 'one');
  });
});
