import { expect, test } from '@playwright/test';

const smokeRoutes = [
  '/',
  '/projects/',
  '/blog/',
  '/resume/',
  '/contact-me/',
  '/about/',
  '/services/',
  '/uses/',
  '/videos/',
  '/react-developer/',
];

test.describe('portfolio smoke', () => {
  for (const route of smokeRoutes) {
    test(`${route} renders core page content`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

      expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(
        page.getByLabel('Primary navigation').getByRole('link', { name: 'Work' })
      ).toBeVisible();
    });
  }

  test('home presents evidence-led portfolio content', async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /holds up after the demo/i })).toBeVisible();
    await expect(page.getByText('Evidence over adjectives.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Current notebook' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inspect the work' }).first()).toBeVisible();

    const notebookSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Current notebook' }),
    });
    const articles = notebookSection.locator('article');
    const articleLinks = articles.locator('h3 a');
    const hrefs = await articleLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href))
    );
    const timestamps = await articles.locator('time[datetime]').evaluateAll((times) =>
      times.map((time) => Date.parse(time.getAttribute('datetime') ?? ''))
    );

    await expect(articles).toHaveCount(3);
    await expect(articleLinks).toHaveCount(3);
    expect(new Set(hrefs).size).toBe(3);
    expect(hrefs.every((href) => href.startsWith('/blog/'))).toBeTruthy();
    expect(timestamps).toHaveLength(3);
    expect(timestamps.every((timestamp) => Number.isFinite(timestamp))).toBeTruthy();
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));

    const firstTitle = await articles.first().getByRole('heading', { level: 3 }).textContent();
    const firstHref = hrefs[0];
    expect(firstHref).toBeTruthy();
    const trailingResponse = await request.get(`http://localhost:4321${firstHref!}/`);
    expect(trailingResponse.status()).toBe(200);
    await page.goto(firstHref!, { waitUntil: 'networkidle' });
    await expect(page.locator('main h1')).toHaveText(firstTitle?.trim() ?? '');
    expect(consoleErrors).toEqual([]);
  });

  test('work page presents curated case studies and engineering outcomes', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('/projects/', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: /Case studies for engineering leaders/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise AI Workflows' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scalable Product Platform' })).toBeVisible();
    await expect(page.getByText('Want the short version?')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
