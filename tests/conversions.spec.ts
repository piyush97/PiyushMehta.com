import { expect, test, type Page } from '@playwright/test';

async function captureBeacons(page: Page) {
  const events: string[] = [];
  await page.route('**/api/conversions', async (route) => {
    events.push(JSON.parse(route.request().postData() ?? '{}').event);
    await route.fulfill({ status: 204 });
  });
  return events;
}

test.describe('conversion beacons', () => {
  test('résumé download reports one anonymous event', async ({ page }) => {
    const events = await captureBeacons(page);
    await page.route('**/resume.pdf', (route) => route.fulfill({ status: 204 }));
    await page.goto('/resume/');
    await page.waitForLoadState('load');
    await page.getByRole('link', { name: 'Download resume as PDF' }).first().click();
    await expect.poll(() => events).toEqual(['resume_download']);
  });

  test('reading-path step reports, the in-page index does not', async ({ page }) => {
    const events = await captureBeacons(page);
    await page.goto('/blog/');
    await page.waitForLoadState('load');
    await page.locator('[data-reading-path-index]').first().click();
    await page.locator('[data-conversion="reading_path_click"]').first().click();
    await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+\/?$/);
    await expect.poll(() => events).toEqual(['reading_path_click']);
  });

  test('stats page asks for a password', async ({ request }) => {
    const res = await request.get('/stats');
    expect([401, 503]).toContain(res.status());
    expect(res.headers()['cache-control']).toBe('no-store');
  });
});
