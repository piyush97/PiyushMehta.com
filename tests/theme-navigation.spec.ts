import { expect, test } from '@playwright/test';

test('theme toggle maintains Dark Reader color scheme detection after client-side navigation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'professional-dark'));
  await page.goto('/');
  await page.getByLabel('Primary navigation').getByRole('link', { name: 'Work' }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(page.locator('html')).toHaveClass(/professional-dark/);
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveClass(/professional-light/);
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
});
