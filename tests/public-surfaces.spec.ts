import { expect, test } from '@playwright/test';

const publicRoutes = ['/projects/', '/about/', '/contact-me/'];

test.describe('redesigned public surfaces', () => {
  for (const route of publicRoutes) {
    test(`${route} keeps one clear page thesis without horizontal overflow`, async ({ page }) => {
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: 'networkidle' });

        await expect(page.locator('main h1')).toHaveCount(1);
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        );
        expect(hasOverflow, `${route} should not overflow at ${width}px`).toBe(false);
      }
    });
  }

  test('projects exposes a scannable case index before complete records', async ({ page }) => {
    await page.goto('/projects/', { waitUntil: 'networkidle' });

    const index = page.locator('[data-work-section="index"]');
    const records = page.locator('[data-case-record]');
    await expect(index.locator('a')).toHaveCount(7);
    await expect(records).toHaveCount(7);
    await expect(page.locator('main h2')).toHaveCount(9);

    const firstRecord = records.first();
    await expect(firstRecord.getByRole('heading', { name: 'FocusTube' })).toBeVisible();
    await expect(firstRecord.getByRole('heading', { name: 'Problem' })).toBeVisible();
    await expect(firstRecord.getByRole('heading', { name: 'Approach' })).toBeVisible();
    await expect(firstRecord.getByRole('heading', { name: 'Outcomes' })).toBeVisible();
    await expect(firstRecord.getByRole('heading', { name: 'Stack' })).toBeVisible();
  });

  test('about composes practice, evidence, proof, and writing in order', async ({ page }) => {
    await page.goto('/about/', { waitUntil: 'networkidle' });

    await expect(page.locator('a[href="/about/"][aria-current="page"]')).toHaveCount(2);
    await expect(page.locator('[data-about-section="focus"] .focus-record')).toHaveCount(3);
    await expect(page.locator('[data-about-section="proof"] .proof-record')).toHaveCount(3);
    await expect(page.locator('.metric-band .evidence-metric')).toHaveCount(4);
    await expect(page.locator('[data-about-section="proof"] a')).toHaveCount(3);
  });

  test('contact puts the form first and announces a successful submission', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    );

    await page.goto('/contact-me/', { waitUntil: 'networkidle' });

    const formSection = page.locator('[data-contact-section="form"]');
    const formPrecedesChannels = await formSection.evaluate((form) => {
      const channels = document.querySelector('[data-contact-section="channels"]');
      return Boolean(
        channels && form.compareDocumentPosition(channels) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    expect(formPrecedesChannels).toBe(true);

    const form = page.locator('#contact-form form');
    await expect(form).toBeVisible();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('#cf-name')).toBeFocused();

    await form.locator('#cf-name').fill('Test Reader');
    await form.locator('#cf-email').fill('reader@example.com');
    await form.locator('#cf-subject').fill('A useful conversation');
    await form.locator('#cf-message').fill('I would like to discuss a system with a clear outcome.');
    await form.locator('button[type="submit"]').click();

    await expect(page.getByRole('status').filter({ hasText: 'Message sent.' })).toBeVisible();
  });

  test('article masthead keeps the reading record coherent', async ({ page }) => {
    await page.goto('/blog/building-focustube-typesafe-jev/', { waitUntil: 'networkidle' });

    await expect(page.locator('[data-article-masthead]')).toHaveCount(1);
    await expect(page.locator('[data-article-masthead] .article-masthead__folio')).toContainText(
      'Field note'
    );
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('.article-date-record')).toContainText(/Published|Updated/);
  });
});
