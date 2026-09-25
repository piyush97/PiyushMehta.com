import { expect, test } from '@playwright/test';
import { selectBlogRecommendations, toBlogPostSlug } from '../src/utils/blog-recommendations';

const articlePath = '/blog/rag-vs-long-context/';

type FixtureEntry = {
  readonly id: string;
  readonly data: {
    readonly date: Date;
    readonly tags: readonly string[];
  };
};

const fixtureEntry = (id: string, date: string, tags: readonly string[]): FixtureEntry => ({
  id: `${id}/index.mdx`,
  data: { date: new Date(date), tags },
});

test.describe('article continuation', () => {
  test('renders one truthful next read before every existing engagement surface', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(articlePath, { waitUntil: 'domcontentloaded' });

    const continuation = page.locator('[data-next-best-read]');
    await expect(continuation).toHaveCount(1);
    await expect(continuation).toBeVisible();
    await expect(continuation.getByText('Read next', { exact: true })).toBeVisible();
    await expect(continuation.locator('[data-next-best-title]')).not.toHaveText('');
    await expect(continuation.locator('[data-next-best-description]')).not.toHaveText('');
    await expect(continuation.locator('[data-next-best-reading-time]')).toHaveText(/^\d+ min read$/);

    const reason = continuation.locator('[data-next-best-reason]');
    const similarity = Number(await continuation.getAttribute('data-similarity'));
    const matchingTags = await continuation.locator('[data-next-best-topic]').allTextContents();
    if (matchingTags.length > 0) {
      expect(similarity).toBeGreaterThan(0);
      await expect(reason).toContainText('Shared topics:');
    } else {
      expect(similarity).toBe(0);
      await expect(reason).toHaveText('Latest from the archive');
    }

    const link = continuation.getByRole('link');
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/blog\/[^/]+\/$/);
    expect(href).not.toBe(articlePath);

    const order = await page.locator('.blog-post-after').evaluate((container) => {
      const selectors = [
        '[data-next-best-read]',
        '.post-reactions',
        '.article-career',
        '.related-posts-section',
      ];
      return selectors.map((selector) => {
        const element = container.querySelector(selector);
        return element === null ? -1 : [...container.children].indexOf(element);
      });
    });
    expect(order.every((position) => position >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((left, right) => left - right));

    const relatedLinks = await page.locator('.related-post-card a.stretched-link').evaluateAll((links) =>
      links.map((relatedLink) => relatedLink.getAttribute('href')),
    );
    expect(relatedLinks.length).toBeGreaterThanOrEqual(1);
    expect(relatedLinks.length).toBeLessThanOrEqual(3);
    expect(new Set(relatedLinks).size).toBe(relatedLinks.length);
    expect(relatedLinks).not.toContain(href);
    expect(relatedLinks).not.toContain(articlePath);

    const title = (await continuation.locator('[data-next-best-title]').textContent())?.trim();
    await link.focus();
    await expect(link).toBeFocused();
    const focusOutline = await link.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusOutline).not.toBe('none');
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href?.replaceAll('/', '\\/')}$`));
    await expect(page.locator('h1.blog-post-title')).toHaveText(title ?? 'missing title');
  });

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 768, height: 1024 },
    { width: 375, height: 812 },
  ] as const) {
    test(`keeps the continuation readable and operable at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(articlePath, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const continuation = page.locator('[data-next-best-read]');
      const link = continuation.getByRole('link');
      await expect(continuation).toBeVisible();
      await expect
        .poll(() => continuation.evaluate((element) => element.getBoundingClientRect().width))
        .toBeLessThanOrEqual(viewport.width);
      await expect
        .poll(() => link.evaluate((element) => element.getBoundingClientRect().height))
        .toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);
    });
  }

  test('handles zero-score, excluded winner, and single-entry fixtures deterministically', () => {
    const current = fixtureEntry('current', '2026-01-01', ['current-topic']);
    const newestZeroScore = fixtureEntry('newest-zero', '2026-03-01', ['different']);
    const olderZeroScore = fixtureEntry('older-zero', '2026-02-01', ['unrelated']);
    const sharedWinner = fixtureEntry('shared-winner', '2026-01-15', ['current-topic']);

    const zeroScore = selectBlogRecommendations([current, olderZeroScore, newestZeroScore], {
      currentSlug: 'current',
      currentTags: current.data.tags,
      limit: 1,
    });
    expect(zeroScore).toHaveLength(1);
    expect(toBlogPostSlug(zeroScore[0]?.entry.id ?? '')).toBe('newest-zero');
    expect(zeroScore[0]?.similarity).toBe(0);
    expect(zeroScore[0]?.matchingTags).toEqual([]);

    const runnerUp = selectBlogRecommendations([current, sharedWinner, newestZeroScore], {
      currentSlug: 'current',
      currentTags: current.data.tags,
      excludeSlugs: ['shared-winner'],
      limit: 1,
    });
    expect(runnerUp).toHaveLength(1);
    expect(toBlogPostSlug(runnerUp[0]?.entry.id ?? '')).toBe('newest-zero');

    expect(
      selectBlogRecommendations([current], {
        currentSlug: 'current',
        currentTags: current.data.tags,
        limit: 1,
      }),
    ).toEqual([]);
  });

  test('does not duplicate the continuation after Astro client navigation', async ({ page }) => {
    await page.goto(articlePath, { waitUntil: 'domcontentloaded' });
    const nextLink = page.locator('[data-next-best-read]').getByRole('link');
    await nextLink.click();
    await expect(page.locator('[data-next-best-read]')).toHaveCount(1);
  });
});
