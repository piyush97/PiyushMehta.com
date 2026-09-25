import { expect, test } from '@playwright/test';

const preview = process.env.TRAFFIC_TEST_URL || 'http://localhost:4321';

test('crawler discovery URLs agree with canonical HTML', async ({ request }) => {
  const sitemap = await request.get(`${preview}/sitemap.xml`);
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  const links = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(links.length).toBeGreaterThan(11);
  for (const route of ['/services', '/resume', '/react-developer']) {
    expect(links).toContain(`https://piyushmehta.com${route}`);
  }
  for (const link of links) {
    expect(new URL(link).pathname).not.toContain('//');
  }
  const feed = await request.get(`${preview}/rss.xml`);
  expect(feed.ok()).toBeTruthy();
  const items = [...(await feed.text()).matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)];
  for (const item of items) expect(links).toContain(item[1]);
  const robots = await request.get(`${preview}/robots.txt`);
  expect(await robots.text()).toContain('Sitemap: https://piyushmehta.com/sitemap.xml');
  expect(await robots.text()).not.toContain('piyushmehta.com//');

  const sitemapAlias = await request.get(`${preview}/sitemap-index.xml`, { maxRedirects: 0 });
  expect(sitemapAlias.status()).toBe(301);
  expect(sitemapAlias.headers().location).toBe('/sitemap.xml');
});

test('readers can reach consulting and recruiting information from an article', async ({ page }) => {
  await page.goto(`${preview}/blog/testing-ai-agent-actions/`);
  const career = page.getByRole('complementary', { name: /I’m Piyush/ });
  await expect(career.getByRole('link', { name: 'Read my résumé' })).toHaveAttribute('href', '/resume/');
  await career.getByRole('link', { name: 'Consulting services' }).click();
  await expect(page).toHaveURL(/\/services\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Technical clarity');
});

test('article structured data uses the canonical URL without tracking parameters', async ({ page }) => {
  await page.goto(`${preview}/blog/testing-ai-agent-actions/?utm_source=test`);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
  const breadcrumb = schema.map((value) => JSON.parse(value)).find((value) => value['@type'] === 'BreadcrumbList');
  expect(breadcrumb.itemListElement.at(-1).item).toBe(canonical);
  expect(canonical).toBe('https://piyushmehta.com/blog/testing-ai-agent-actions');
});

test('important landing content stays visible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ['/', '/blog/', '/about/']) {
    await page.goto(`${preview}${route}`);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    // Playwright visibility does not treat opacity:0 as hidden; check ancestors too.
    await expect
      .poll(() =>
        heading.evaluate((el) => {
          for (let parent: Element | null = el; parent; parent = parent.parentElement) {
            if (getComputedStyle(parent).opacity === '0') return false;
          }
          return true;
        })
      )
      .toBe(true);
  }
  await context.close();
});
