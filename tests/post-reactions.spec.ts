import { expect, test } from '@playwright/test';

test.describe('Post reactions', () => {
  test('initializes after client-side blog navigation and persists a reaction', async ({
    page,
  }) => {
    await page.goto('/blog/');

    await page.locator('a[href="/blog/zero-downtime-database-migration-at-scale"]').click();

    await expect(page).toHaveURL(/\/blog\/zero-downtime-database-migration-at-scale\/?$/);

    const helpfulButton = page.locator('.post-reactions button[data-reaction="helpful"]');
    await expect(helpfulButton).toHaveAttribute('aria-pressed', 'false');

    await helpfulButton.click();

    await expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
    await expect(helpfulButton.locator('.reaction-count')).toHaveText('1');

    await page.reload();

    await expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
    await expect(helpfulButton.locator('.reaction-count')).toHaveText('1');
  });
});
