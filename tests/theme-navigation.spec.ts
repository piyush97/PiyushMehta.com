import { expect, test } from '@playwright/test';

test('theme toggle works after client-side navigation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'professional-dark'));
  await page.goto('/');
  await page.getByLabel('Primary navigation').getByRole('link', { name: 'Work' }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(page.locator('html')).toHaveClass(/professional-dark/);

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveClass(/professional-light/);
});
