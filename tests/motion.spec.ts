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

  test('only the clicked title morphs into the article h1', async ({ page }) => {
    // Given the blog index with motion initialized
    await page.goto('/blog/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.__portfolioMotionState));
    const row = page.locator('[data-post-card] h3 a').first();
    const href = await row.getAttribute('href');
    const slug = href!.replace(/^\/blog\//, '').replace(/\/$/, '');

    // Then no listed title is named before a click
    const named = await page
      .locator('[data-vt-title]')
      .evaluateAll((els) => els.filter((el) => getComputedStyle(el).viewTransitionName !== 'none').length);
    expect(named).toBe(0);

    // When the first title is clicked, record names right before the swap
    await page.evaluate(() => {
      document.addEventListener(
        'astro:before-swap',
        () => {
          (window as unknown as { __named: string[] }).__named = Array.from(
            document.querySelectorAll('[data-vt-title]'),
          )
            .map((el) => getComputedStyle(el).viewTransitionName)
            .filter((name) => name !== 'none');
        },
        { once: true },
      );
    });
    await row.click();
    await page.waitForURL(`**${href}`);

    // Then exactly the clicked title was named, matching the article h1
    const before = await page.evaluate(() => (window as unknown as { __named: string[] }).__named);
    expect(before).toEqual([`post-title-${slug}`]);
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
