import { expect, test, type Page } from '@playwright/test';

// Host page for framing tests. Served from the same origin (so Chrome's local network checks stay
// out of the way) but without the site's CSP, whose frame-src would block the iframe on its own.
// frame-ancestors and X-Frame-Options still apply to same-origin frames, so this tests the headers.
async function mountHost(page: Page, baseURL: string | undefined, src: string) {
  const origin = new URL(baseURL ?? 'http://localhost:4321').origin;
  await page.route(`${origin}/__lab-host`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><title>host</title><iframe title="under test" src="${src}" width="700" height="600"></iframe>`,
    }),
  );
  await page.goto('/__lab-host', { waitUntil: 'domcontentloaded' });
}

test.describe('lab', () => {
  test('index lists the demos and links each one', async ({ page }) => {
    const response = await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('main h1')).toHaveCount(1);

    const items = page.locator('[data-lab-item]');
    expect(await items.count()).toBeGreaterThanOrEqual(4);
    for (const slug of ['bloom-filter', 'cache-channel', 'asterisk-chain', 'agent-gate']) {
      await expect(page.locator(`[data-lab-item="${slug}"] a[href="/lab/${slug}"]`)).toBeVisible();
    }
    await expect(page.locator('[data-lab-empty]')).toHaveCount(0);
  });

  test('a demo page renders the demo, source link, and distinct social card', async ({ page }) => {
    const response = await page.goto('/lab/agent-gate', { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    // Non-frameable: the full page keeps DENY.
    expect(response?.headers()['x-frame-options'] ?? 'DENY').toBe('DENY');

    await expect(page.locator('main h1')).toHaveText('Agent PR gate simulator');
    await expect(page.locator('[data-gate-sim]')).toBeVisible();
    await expect(
      page.locator('.lab-demo__context a[href="/blog/ai-coding-agent-security-gate"]'),
    ).toBeVisible();

    await page.locator('[data-pr]').selectOption({ label: 'Search endpoint' });
    await expect(page.locator('[data-verdict]')).toContainText('Blocked by Semgrep');

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('/lab/og/agent-gate.png');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);

    const card = await page.request.get(ogImage!.replace(/^https?:\/\/[^/]+/, ''));
    expect(card.status()).toBe(200);
    expect(card.headers()['content-type']).toContain('image/png');
  });

  test('a React demo hydrates on the demo page', async ({ page }) => {
    await page.goto('/lab/bloom-filter', { waitUntil: 'networkidle' });
    await page.getByLabel('Add item to filter').fill('netflix');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('netflix').first()).toBeVisible();
  });

  test('embed snippet and link copy controls work from the keyboard', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/lab/luna-decisions', { waitUntil: 'networkidle' });

    const snippet = page.locator('[data-lab-embed-snippet]');
    await expect(snippet).toHaveValue(/<iframe src="https:\/\/piyushmehta\.com\/lab\/embed\/luna-decisions"/);
    await expect(snippet).toHaveValue(/title="Decision threshold playground"/);

    const copyLink = page.getByRole('button', { name: 'Copy link' });
    await copyLink.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-copy-status]')).toContainText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://piyushmehta.com/lab/luna-decisions',
    );

    const copyEmbed = page.getByRole('button', { name: 'Copy embed code' });
    await copyEmbed.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-copy-status]')).toContainText('Embed code copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('/lab/embed/luna-decisions');
    expect(baseURL).toBeTruthy();
  });

  test('copy falls back to a selected field when the clipboard is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.goto('/lab/luna-decisions', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('[data-copy-status]')).toContainText('Copy was blocked');
    await expect(page.locator('#lab-share-link')).toBeFocused();
  });

  test('embed route has no site chrome, is noindex, and is frameable', async ({ page, request }) => {
    const response = await page.goto('/lab/embed/agent-gate', { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator('nav.site-nav')).toHaveCount(0);
    await expect(page.locator('footer.site-footer')).toHaveCount(0);
    await expect(page.locator('.skip-to-main')).toHaveCount(0);
    await expect(page.locator('[data-gate-sim]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('link', { name: 'from piyushmehta.com' })).toHaveAttribute(
      'href',
      'https://piyushmehta.com/lab/agent-gate',
    );

    const headers = (await request.get('/lab/embed/agent-gate')).headers();
    expect(headers['x-frame-options']).toBeUndefined();
    expect(headers['content-security-policy'] ?? '').toContain('frame-ancestors *');
  });

  test('the embed renders inside an iframe', async ({ page, baseURL }) => {
    await mountHost(page, baseURL, '/lab/embed/luna-decisions');
    const frame = page.frameLocator('iframe[title="under test"]');
    await expect(frame.locator('[data-luna-demo]')).toBeVisible();
    await expect(frame.locator('nav.site-nav')).toHaveCount(0);
  });

  test('the full demo page refuses to be framed', async ({ page, baseURL }) => {
    await mountHost(page, baseURL, '/lab/luna-decisions');
    await expect
      .poll(() => page.frames().some((f) => f.url().startsWith('chrome-error://')))
      .toBe(true);
    const framed = page.frames().find((f) => f.url().includes('/lab/luna-decisions'));
    expect(framed).toBeUndefined();
  });

  test('unknown demo slug is a 404', async ({ request }) => {
    expect((await request.get('/lab/not-a-demo')).status()).toBe(404);
    expect((await request.get('/lab/embed/not-a-demo')).status()).toBe(404);
  });

  test('sitemap lists the lab pages but not the embeds', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('https://piyushmehta.com/lab</loc>');
    expect(xml).toContain('https://piyushmehta.com/lab/bloom-filter</loc>');
    expect(xml).not.toContain('/lab/embed/');
  });
});
