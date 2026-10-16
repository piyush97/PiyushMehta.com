import { expect, test } from '@playwright/test';

const METRICS = ['30%', '35–40%', '1,500+'];

test.describe('site motion', () => {
  test('home metrics settle on their exact final text', async ({ page }) => {
    // Given the homepage is opened
    await page.goto('/', { waitUntil: 'networkidle' });

    // When the metric rail scrolls into view and the count-up finishes
    const metrics = page.locator('[data-count-up]');
    await metrics.first().scrollIntoViewIfNeeded();

    // Then each metric ends at its authored value
    for (const [index, text] of METRICS.entries()) {
      await expect(metrics.nth(index)).toHaveText(text, { timeout: 4000 });
    }
  });

  test('reduced motion shows final metrics immediately', async ({ page }) => {
    // Given the visitor prefers reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // When the homepage loads
    await page.goto('/', { waitUntil: 'networkidle' });

    // Then metrics are final with no tween
    const metrics = page.locator('[data-count-up]');
    for (const [index, text] of METRICS.entries()) {
      await expect(metrics.nth(index)).toHaveText(text);
    }
  });

  test('blog list row and article h1 share a view-transition name', async ({ page }) => {
    // Given the blog index
    await page.goto('/blog/', { waitUntil: 'networkidle' });
    const row = page.locator('[data-post-card] h3 a').first();
    const href = await row.getAttribute('href');
    const slug = href!.replace(/^\/blog\//, '').replace(/\/$/, '');

    // Then the row title carries the post's transition name
    const rowName = await page
      .locator('[data-post-card] h3')
      .first()
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(rowName).toBe(`post-title-${slug}`);

    // When the post opens, its h1 carries the same name
    await page.goto(href!, { waitUntil: 'networkidle' });
    const h1Name = await page
      .locator('h1.blog-post-title')
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(h1Name).toBe(`post-title-${slug}`);
  });

  test('article has a decorative reading progress bar', async ({ page }) => {
    // Given any article
    await page.goto('/blog/', { waitUntil: 'networkidle' });
    const href = await page.locator('[data-post-card] h3 a').first().getAttribute('href');
    await page.goto(href!, { waitUntil: 'networkidle' });

    // Then the bar exists and is hidden from assistive tech
    await expect(page.locator('.reading-progress')).toHaveAttribute('aria-hidden', 'true');
  });

  test('TOC marker follows the active section', async ({ page }) => {
    // Given a desktop article with a table of contents
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/blog/', { waitUntil: 'networkidle' });
    const hrefs = await page.locator('[data-post-card] h3 a').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href'))
    );
    let found = false;
    for (const href of hrefs.slice(0, 6)) {
      await page.goto(href!, { waitUntil: 'networkidle' });
      if ((await page.locator('.article-toc--desktop a').count()) > 2) {
        found = true;
        break;
      }
    }
    test.skip(!found, 'no post with a multi-heading TOC in first 6');

    // When the reader scrolls to a later heading
    const marker = page.locator('.article-toc--desktop .article-toc__marker');
    await expect(marker).toHaveAttribute('data-ready', 'true');
    const first = await marker.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--marker-y'));
    const links = page.locator('.article-toc--desktop a');
    const lastHash = await links.last().getAttribute('href');
    await page.locator(lastHash!).scrollIntoViewIfNeeded();
    await page.evaluate((hash) => document.querySelector(hash)?.scrollIntoView(), lastHash!);

    // Then the marker position changed
    await expect
      .poll(() => marker.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--marker-y')))
      .not.toBe(first);
  });
});
