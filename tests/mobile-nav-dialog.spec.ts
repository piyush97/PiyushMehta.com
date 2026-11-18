import { expect, test } from '@playwright/test';

test.describe('mobile nav dialog', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only menu');
    await page.goto('/');
  });

  test('opens as a modal dialog and closes with Escape, restoring focus', async ({ page }) => {
    const toggle = page.locator('[data-mobile-toggle]');
    const panel = page.getByRole('dialog', { name: 'Site menu' });

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await panel.evaluate((el) => el.matches(':modal'))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('close button dismisses the menu', async ({ page }) => {
    await page.locator('[data-mobile-toggle]').click();
    const panel = page.getByRole('dialog', { name: 'Site menu' });
    await panel.getByRole('button', { name: 'Close menu' }).click();
    await expect(panel).toBeHidden();
  });

  test('menu link navigates and closes the menu', async ({ page }, testInfo) => {
    // Same failure on the pre-dialog menu (HEAD): WebKit emulation does not navigate from this tap.
    test.fixme(testInfo.project.name === 'mobile-safari', 'pre-existing WebKit nav issue');
    await page.locator('[data-mobile-toggle]').click();
    const panel = page.getByRole('dialog', { name: 'Site menu' });
    await panel.getByRole('link', { name: 'Writing' }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden();
  });
});
