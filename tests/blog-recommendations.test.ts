import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { selectBlogRecommendations } from '../src/utils/blog-recommendations';

type TestEntry = {
  readonly id: string;
  readonly data: {
    readonly date: Date;
    readonly tags: readonly string[];
    readonly draft?: boolean;
  };
};

const entry = (
  id: string,
  date: string,
  tags: readonly string[],
  draft = false
): TestEntry => ({
  id,
  data: {
    date: new Date(date),
    tags,
    draft,
  },
});

describe('selectBlogRecommendations', () => {
  it('ranks higher Jaccard similarity ahead of newer publication date', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', ['TypeScript', 'Astro']),
      entry('older-strong-match', '2024-01-01', ['typescript', 'astro', 'testing']),
      entry('newer-weak-match', '2026-02-01', ['Astro', 'design', 'accessibility']),
    ];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: ['TypeScript', 'Astro'],
      limit: 3,
    });

    // Then
    assert.deepEqual(
      recommendations.map(({ entry: recommendation, similarity }) => [
        recommendation.id,
        similarity,
      ]),
      [
        ['older-strong-match', 2 / 3],
        ['newer-weak-match', 1 / 4],
      ]
    );
  });

  it('matches exact tags case-insensitively and counts duplicate casing once', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', ['ASTRO', 'astro', 'TypeScript']),
      entry('candidate', '2026-01-02', ['Astro', 'ASTRO', 'CSS']),
    ];

    // When
    const [recommendation] = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: entries[0].data.tags,
      limit: 1,
    });

    // Then
    assert.ok(recommendation);
    assert.equal(recommendation.similarity, 1 / 3);
    assert.deepEqual(recommendation.matchingTags, ['Astro']);
  });

  it('excludes the current, explicitly excluded, and draft entries', () => {
    // Given
    const entries = [
      entry('current/index.mdx', '2026-01-01', ['Astro']),
      entry('excluded/index.md', '2026-03-01', ['Astro']),
      entry('draft', '2026-04-01', ['Astro'], true),
      entry('eligible', '2025-01-01', ['Astro']),
    ];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: ['Astro'],
      excludeSlugs: ['excluded'],
      limit: 4,
    });

    // Then
    assert.deepEqual(
      recommendations.map(({ entry: recommendation }) => recommendation.id),
      ['eligible']
    );
  });

  it('uses publication date when similarity scores are equal', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', ['Astro']),
      entry('older', '2025-01-01', ['Astro', 'CSS']),
      entry('newer', '2026-02-01', ['Astro', 'React']),
    ];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: ['Astro'],
      limit: 2,
    });

    // Then
    assert.deepEqual(
      recommendations.map(({ entry: recommendation }) => recommendation.id),
      ['newer', 'older']
    );
  });

  it('uses normalized slug ascending when score and date are tied', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', ['Astro']),
      entry('zeta/index.mdx', '2026-02-01', ['Astro']),
      entry('alpha/index.md', '2026-02-01', ['Astro']),
    ];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: ['Astro'],
      limit: 2,
    });

    // Then
    assert.deepEqual(
      recommendations.map(({ entry: recommendation }) => recommendation.id),
      ['alpha/index.md', 'zeta/index.mdx']
    );
  });

  it('honors the requested limit', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', []),
      entry('one', '2026-04-01', []),
      entry('two', '2026-03-01', []),
      entry('three', '2026-02-01', []),
    ];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: [],
      limit: 2,
    });

    // Then
    assert.deepEqual(
      recommendations.map(({ entry: recommendation }) => recommendation.id),
      ['one', 'two']
    );
  });

  it('falls back to newest-first ordering when the current entry has no tags', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', []),
      entry('old-matchless', '2024-01-01', ['Astro']),
      entry('new-matchless', '2026-02-01', ['TypeScript']),
    ];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: [],
      limit: 2,
    });

    // Then
    assert.deepEqual(
      recommendations.map(({ entry: recommendation, similarity }) => [
        recommendation.id,
        similarity,
      ]),
      [
        ['new-matchless', 0],
        ['old-matchless', 0],
      ]
    );
  });

  it('returns an empty list when the current entry is the only candidate', () => {
    // Given
    const entries = [entry('current', '2026-01-01', ['Astro'])];

    // When
    const recommendations = selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags: ['Astro'],
      limit: 3,
    });

    // Then
    assert.deepEqual(recommendations, []);
  });

  it('does not mutate entries, tags, or exclusions', () => {
    // Given
    const entries = [
      entry('current', '2026-01-01', ['Astro']),
      entry('candidate', '2026-02-01', ['Astro', 'TypeScript']),
    ];
    const currentTags = ['Astro'];
    const excludeSlugs = ['not-present'];
    const entriesBefore = structuredClone(entries);
    const currentTagsBefore = [...currentTags];
    const excludeSlugsBefore = [...excludeSlugs];

    // When
    selectBlogRecommendations(entries, {
      currentSlug: 'current',
      currentTags,
      excludeSlugs,
      limit: 1,
    });

    // Then
    assert.deepEqual(entries, entriesBefore);
    assert.deepEqual(currentTags, currentTagsBefore);
    assert.deepEqual(excludeSlugs, excludeSlugsBefore);
  });
});
