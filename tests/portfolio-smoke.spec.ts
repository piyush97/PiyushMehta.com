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

  test('home presents evidence and recent writing', async ({ page, request }) => {
    await page.route('**/api/reactions*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ like: 0, helpful: 0, insightful: 0, bookmark: 0 }),
      }),
    );

    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /holds up after the demo/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Enterprise AI Workflows' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent writing' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Selected systems' })).toHaveCount(0);

    const notebookSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Recent writing' }),
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

  test('resume exposes direct PDF downloads', async ({ page, request }) => {
    await page.goto('/resume/', { waitUntil: 'domcontentloaded' });

    const downloadLinks = page.getByRole('link', { name: 'Download resume as PDF' });
    await expect(downloadLinks).toHaveCount(2);
    await expect(downloadLinks.first()).toHaveAttribute('href', '/resume.pdf');
    await expect(downloadLinks.first()).toHaveAttribute('download', 'piyush-mehta-resume.pdf');

    const response = await request.get('/resume.pdf');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('FocusTube appears as a project and links to its technical article', async ({ page }) => {
    await page.goto('/projects/', { waitUntil: 'domcontentloaded' });

    const focusTube = page.locator('article').filter({
      has: page.getByRole('heading', { name: 'FocusTube' }),
    });

    await expect(focusTube).toBeVisible();
    await expect(focusTube.getByText('TypeSafe Jev', { exact: true })).toBeVisible();
    await expect(focusTube.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/piyush97/focus-tube',
    );

    await focusTube.getByRole('link', { name: 'Technical article' }).click();
    await expect(page).toHaveURL(/\/blog\/building-focustube-typesafe-jev\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Building FocusTube with TypeSafe Jev' }),
    ).toBeVisible();
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
