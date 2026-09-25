import { expect, test } from '@playwright/test';

test.describe('Post reactions', () => {
  test('initializes after client-side blog navigation and persists a reaction', async ({
    page,
  }) => {
    let count = 0;

    await page.route('**/api/reactions*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as { action?: 'add' | 'remove' };
        count = Math.max(0, count + (body.action === 'add' ? 1 : -1));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ like: count, helpful: count, insightful: 0, bookmark: 0 }),
      });
    });

    await page.goto('/blog/zero-downtime-database-migration-at-scale/', {
      waitUntil: 'networkidle',
    });

    const helpfulButton = page.locator('.post-reactions button[data-reaction="helpful"]');
    await expect(helpfulButton).toHaveAttribute('aria-pressed', 'false');

    await helpfulButton.click();

    await expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
    await expect(helpfulButton.locator('.reaction-count')).toHaveText('1');

    await page.reload({ waitUntil: 'networkidle' });

    await expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
    await expect(helpfulButton.locator('.reaction-count')).toHaveText('1');
  });
});
