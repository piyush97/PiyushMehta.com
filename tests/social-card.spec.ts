import { expect, type Page, test } from '@playwright/test';

async function getImageDimensions(page: Page, path: string) {
  await page.goto(path);

  return page.locator('img').evaluate((image: HTMLImageElement) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
  }));
}

test.describe('Social cards', () => {
  test('serves crawler-friendly home, article, and fallback cards', async ({ page, request }) => {
    for (const path of [
      '/og/home.png',
      '/og/blog/bloom-filters.png',
      // "Kubenetes-Docker" (typo) was never a real post — it only ever existed as a legacy image
      // asset directory. Its card path is the lowercase, correctly-spelled slug.
      '/og/blog/kubernetes-docker.png',
      // Guaranteed to exist for any page without a dedicated card — see DEFAULT_SOCIAL_CARD_KEY.
      '/og/default.png',
      // Previously-missing pages that used to 404 (see src/utils/social-card.ts STATIC_SOCIAL_PAGES).
      '/og/404.png',
      '/og/newsletter.png',
      '/og/privacy-policy.png',
      '/og/terms-of-service.png',
    ]) {
      const response = await request.get(path);

      expect(response.status(), path).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
      expect(Number(response.headers()['content-length'])).toBeGreaterThan(20_000);
      expect(response.headers()['cache-control']).toContain('max-age=31536000');

      const dimensions = await getImageDimensions(page, path);
      expect(dimensions).toEqual({ width: 1200, height: 630 });
    }
  });

  test('uses clean, cache-busted social card URLs in page metadata', async ({ page }) => {
    await page.goto('/');

    // og:image carries a content-hash ?v= so platforms re-fetch when the card changes (or when
    // SOCIAL_CARD_RENDERER_VERSION is bumped) instead of serving a stale/blank cached image
    // forever against an unchanging URL.
    const ogImagePattern = /\/og\/home\.png\?v=[0-9a-f]{8}$/;

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      ogImagePattern
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      ogImagePattern
    );
    // Twitter/X's spec uses name="twitter:*", not property="twitter:*" — SEO.astro correctly
    // emits only the name= form, so no property="twitter:*" assertions here.
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200'
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630'
    );
  });

  // Legacy mixed-case blog URL redirects (/blog/The-Silent-S-in-HTTPS -> lowercase, etc.) are
  // implemented via public/_redirects, which is a Cloudflare-edge mechanism the Astro dev server
  // this suite runs against does not process. That coverage lives in
  // scripts/verify-og.mjs (checkRedirectsFile), which runs against the real built
  // dist/client/_redirects as part of `bun run build`, plus the manual curl checks in
  // the deploy runbook.
});
