import { expect, type Page, test } from '@playwright/test';

async function getImageDimensions(page: Page, path: string) {
  await page.goto(path);

  return page.locator('img').evaluate((image: HTMLImageElement) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
  }));
}

test.describe('Social cards', () => {
  test('serves crawler-friendly home and article cards', async ({ page, request }) => {
    for (const path of [
      '/og/home.png',
      '/og/blog/bloom-filters.png',
      '/og/blog/Kubenetes-Docker.png',
    ]) {
      const response = await request.get(path);

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
      expect(Number(response.headers()['content-length'])).toBeGreaterThan(50_000);
      expect(response.headers()['cache-control']).toContain('max-age=31536000');

      const dimensions = await getImageDimensions(page, path);
      expect(dimensions).toEqual({ width: 1200, height: 630 });
    }
  });

  test('uses clean social card URLs in page metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\/home\.png$/
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      /\/og\/home\.png$/
    );
    await expect(page.locator('meta[property="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    await expect(page.locator('meta[property="twitter:image"]')).toHaveAttribute(
      'content',
      /\/og\/home\.png$/
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200'
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630'
    );
  });
});
