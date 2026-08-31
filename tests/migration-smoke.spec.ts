import { expect, test } from '@playwright/test';

test.describe('astro v6 migration smoke', () => {
  test('core routes render', async ({ page }) => {
    for (const route of ['/', '/blog/', '/projects/']) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.ok(), `${route} should return success`).toBeTruthy();
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('blog detail routes resolve from index links', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'networkidle' });

    const postLink = page.locator('[data-writing-list] article h3 a').first();
    test.skip((await postLink.count()) === 0, 'No blog links found on /blog/');

    const href = await postLink.getAttribute('href');
    expect(href).toBeTruthy();
    await postLink.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/blog/');
    await expect(page.locator('article').first()).toBeVisible();
  });
  test('RAG article images load as SVG assets', async ({ page }) => {
    await page.goto('/blog/rag-vs-long-context', { waitUntil: 'networkidle' });

    const imageAlts = [
      'A two-panel comparison of long context, where all documents enter one prompt, and RAG, where selected passages reach the model',
      'RAG vs long context hero',
      'Long context: everything goes into one prompt',
      'RAG: retrieve only relevant passages',
    ];

    for (const alt of imageAlts) {
      const image = page.locator('article img[alt="' + alt + '"]');
      await expect(image).toHaveCount(1);
      const src = await image.getAttribute('src');
      expect(src, alt + ' should have a source URL').toBeTruthy();
      expect(src, alt + ' should not use Astro image optimization for SVG').not.toContain('/_image');
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
  });

  test('blog index shows non-zero published pieces', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/\d+\s+published pieces/i)).toBeVisible();
    await expect(page.getByText(/^0\s+published pieces$/i)).toHaveCount(0);
  });

  test('blog filters hydrate from URL query params', async ({ page }) => {
    await page.goto('/blog/?q=astro&sort=title&order=asc', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#blog-search')).toHaveValue('astro');
    await expect(page.locator('[data-filter-sort]')).toHaveValue('title');
    await expect(page.locator('[data-filter-order]')).toHaveValue('asc');
  });
  test('blog filter reinitializes after client-side navigation', async ({ page }) => {
    const navigateViaNav = async (href: '/' | '/blog/') => {
      const desktopLink = page.locator(`.site-nav__links a[href="${href}"]:visible`).first();

      if (await desktopLink.count()) {
        await desktopLink.click();
      } else {
        await page.locator('[data-mobile-toggle]').click();
        await page.locator(`[data-mobile-panel] a[href="${href}"]`).click();
      }
    };

    await page.goto('/');
    await navigateViaNav('/blog/');
    await expect(page).toHaveURL(/\/blog\/?$/);
    const search = page.locator('#blog-search');
    await search.fill('zzzz-no-match');
    await expect(page.locator('[data-result-count]')).toHaveText('0');

    await navigateViaNav('/');
    await expect(page).toHaveURL(/\/$/);
    await navigateViaNav('/blog/');
    await expect(page).toHaveURL(/\/blog\/?$/);

    await page.locator('#blog-search').fill('zzzz-no-match');
    await expect(page.locator('[data-result-count]')).toHaveText('0');
  });

  test('blog read links expose post-specific names and touch targets', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });

    const readLink = page.locator('.writing-list__footer a').first();
    await expect(readLink).toHaveAttribute('aria-label', /Read “.+”/);
    await expect(readLink).toHaveCSS('min-height', '44px');
  });
  test('newsletter forms expose unique labelled email fields', async ({ page }) => {
    await page.goto('/newsletter/', { waitUntil: 'domcontentloaded' });

    const emailIds = await page.locator('input[type="email"]').evaluateAll((inputs) =>
      inputs.map((input) => input.id),
    );

    expect(emailIds).toHaveLength(2);
    expect(new Set(emailIds).size).toBe(emailIds.length);
    for (const id of emailIds) {
      expect(id).toBeTruthy();
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
  });
  test('rss and sitemap return xml', async ({ request }) => {
    const rss = await request.get('/rss.xml');
    expect(rss.ok()).toBeTruthy();
    expect(rss.headers()['content-type'] || '').toContain('xml');
    expect(await rss.text()).toContain('<rss');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(sitemap.headers()['content-type'] || '').toContain('xml');
    expect(await sitemap.text()).toContain('<urlset');
  });

  test('PWA icons and legacy tag links resolve', async ({ request }) => {
    for (const icon of ['/images/icon-192.png', '/images/icon-512.png']) {
      expect((await request.get(icon)).ok(), `${icon} should return success`).toBeTruthy();
    }

    for (const [path, theme] of [
      ['/blog/tag/openai', 'OpenAI'],
      ['/blog/tag/architecture', 'architecture'],
      ['/blog/tag/microfrontend', 'Microfrontend'],
      ['/blog/tag/microservice', 'microservice'],
    ]) {
      const tag = await request.get(path, { maxRedirects: 0 });
      expect(tag.status(), `${path} should redirect`).toBe(301);
      expect(tag.headers().location).toBe(`/blog/?theme=${theme}`);
    }
  });

  test('legacy /twitter-image and /opengraph-image routes are gone', async ({ request }) => {
    // Both used to be prerendered per-page static files under `output: 'server'` +
    // @astrojs/cloudflare, which cannot serve them correctly (an extensionless PNG with no
    // Content-Type, and an HTML meta-refresh page where an image was expected, respectively).
    // They're removed now; a 301 to /og/default.png for any old share still pointing at them is
    // implemented via public/_redirects, a Cloudflare-edge mechanism the Astro dev server this
    // suite runs against does not process — that coverage lives in scripts/verify-og.mjs
    // (checkRedirectsFile) against the real built dist/client/_redirects, plus the manual curl
    // checks in the deploy runbook. Here we only confirm the routes no longer exist as pages.
    for (const path of ['/twitter-image', '/opengraph-image']) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} should not resolve as a page`).toBe(404);
    }
  });

  test('service worker artifact available', async ({ request }) => {
    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBeTruthy();
    expect(sw.headers()['content-type'] || '').toContain('javascript');
  });
});
