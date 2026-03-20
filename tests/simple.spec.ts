import { expect, test } from '@playwright/test';

test('simple test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Piyush Mehta/);
});
