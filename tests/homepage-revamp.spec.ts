import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const responsiveViewports = [
  { name: 'small mobile', width: 320, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const headlineViewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const;

test.describe('pinned-poster homepage', () => {
  test('renders the sentence-frame hero with a reel, one action and the ask input', async ({
    page,
  }) => {
    // Given the homepage is opened at the desktop reference size
    await page.setViewportSize({ width: 1440, height: 900 });

    // When the first viewport finishes rendering
    await page.goto('/', { waitUntil: 'networkidle' });

    // Then the sentence is split into two halves around the reel
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toHaveCount(1);
    await expect(headline).toHaveText('Piyush Mehta ships AI tools.');
    const halves = page.locator('[data-hero] .half');
    await expect(halves).toHaveCount(2);
    const [left, right] = await halves.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect())
    );
    expect(left.right).toBeLessThan(right.left);

    // And the reel holds real, described frames with the speaker photo first
    const frames = page.locator('[data-reel] .frame img');
    await expect(frames).toHaveCount(4);
    await expect(
      page.getByRole('img', { name: 'Piyush Mehta speaking on stage at a developer conference' }).first()
    ).toBeVisible();
    for (const frame of await frames.all()) {
      expect((await frame.getAttribute('alt'))?.length ?? 0).toBeGreaterThan(0);
      expect(await frame.getAttribute('width')).toBeTruthy();
      expect(await frame.getAttribute('height')).toBeTruthy();
    }

    // And the one live thing is a single-line input that submits to /ask
    const ask = page.locator('[data-home-ask]');
    await expect(ask).toHaveAttribute('method', /get/i);
    await expect(ask).toHaveAttribute('action', '/ask');
    await expect(ask.getByLabel('Ask Piyush a question about his work')).toHaveAttribute('name', 'q');
    await expect(ask.getByRole('button', { name: 'Ask Piyush' })).toBeVisible();
    await expect(page.locator('[data-hero]').getByText('Based in Canada')).toBeVisible();
  });

  test('pins the hero with sticky positioning and advances the reel without hijacking scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Pinning is CSS sticky and the hero stays within three viewports
    const stage = page.locator('[data-hero] .hero-stage');
    await expect(stage).toHaveCSS('position', 'sticky');
    const heroHeight = await page.locator('[data-hero]').evaluate((element) => element.getBoundingClientRect().height);
    expect(heroHeight).toBeLessThanOrEqual(900 * 3);

    // Scrolling moves the page exactly as asked and steps the reel to a later frame
    const current = page.locator('[data-reel] .frame.is-current');
    await expect(current).toHaveCount(1);
    await expect(page.locator('[data-reel] .frame').first()).toHaveClass(/is-current/);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.4));
    await expect
      .poll(async () => page.locator('[data-reel] .frame').first().evaluate((el) => el.classList.contains('is-current')))
      .toBe(false);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(Math.round(900 * 1.4));
  });

  for (const viewport of headlineViewports) {
    test(`keeps the headline to two lines at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });

      const metrics = await page.locator('[data-hero] .half').evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return { lines: box.height / parseFloat(style.lineHeight), top: Math.round(box.top) };
        })
      );
      // Each half is one line, so the whole sentence never exceeds two lines
      for (const half of metrics) expect(half.lines).toBeLessThan(1.5);
      expect(metrics).toHaveLength(2);
    });
  }

  test('lists case studies as full-height panels linked to the projects page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const panels = page.locator('.work .panel');
    await expect(panels).toHaveCount(5);
    for (const panel of await panels.all()) {
      await expect(panel.getByRole('heading', { level: 2 }).getByRole('link')).toHaveAttribute(
        'href',
        /^\/projects#case-\d+$/
      );
      const height = (await panel.boundingBox())?.height ?? 0;
      expect(Math.round(height)).toBe(900);
    }

    const understory = panels.filter({ has: page.getByRole('link', { name: 'Understory' }) });
    await expect(understory.getByRole('link', { name: 'Understory' })).toHaveAttribute(
      'href',
      '/projects#case-1'
    );
    await expect(understory.getByText('2026')).toBeVisible();
    await expect(understory.locator('img')).toHaveCount(1);
    await expect(
      panels.filter({ has: page.getByRole('link', { name: 'Enterprise AI Workflows' }) }).getByText('2023-2026')
    ).toHaveCount(1);
  });

  test('crossfades a sticky photograph to the hovered and focused post', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const writing = page.locator('[data-writing]');
    await expect(writing.getByRole('heading', { level: 2, name: 'Recent writing' })).toBeVisible();
    const rows = writing.locator('[data-row]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(7);

    // Rows are real links to posts, newest first
    const hrefs = await rows.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    for (const href of hrefs) expect(href).toMatch(/^\/blog\/[^/]+$/);
    const stamps = await rows.locator('time').evaluateAll((items) =>
      items.map((item) => item.getAttribute('datetime') ?? '')
    );
    expect([...stamps].sort().reverse()).toEqual(stamps);

    // The first cover is active before any interaction, so it works without JS too
    await expect(writing.locator('[data-cover-img="0"]')).toHaveClass(/is-active/);
    await expect(writing.locator('.writing-photo')).toHaveCSS('position', 'sticky');

    // Hover and keyboard focus both move the active cover (opacity crossfade)
    const targets = await rows.evaluateAll((elements) =>
      elements.map((element, index) => ({ index, cover: (element as HTMLElement).dataset.cover ?? '' }))
    );
    const next = targets.find((target) => target.index > 0 && target.cover !== '' && target.cover !== '0');
    test.skip(!next, 'no second cover available to crossfade to');
    if (!next) return;
    await rows.nth(next.index).scrollIntoViewIfNeeded();
    await rows.nth(next.index).hover();
    await expect(writing.locator(`[data-cover-img="${next.cover}"]`)).toHaveClass(/is-active/);
    await expect(writing.locator('[data-cover-img="0"]')).not.toHaveClass(/is-active/);
    await expect(writing.locator(`[data-cover-img="${next.cover}"]`)).toHaveCSS('opacity', '1');

    await rows.first().locator('a').focus();
    await expect(writing.locator('[data-cover-img="0"]')).toHaveClass(/is-active/);
  });

  test('pins the on-stage title while the portraits scroll past', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const stage = page.locator('[data-home-section="stage"]');
    await expect(stage.getByRole('heading', { level: 2, name: 'On stage' })).toBeAttached();
    await expect(stage.locator('.onstage-pin')).toHaveCSS('position', 'sticky');

    const portraits = stage.locator('.portrait img');
    await expect(portraits).toHaveCount(3);
    for (const portrait of await portraits.all()) {
      expect((await portrait.getAttribute('alt'))?.length ?? 0).toBeGreaterThan(0);
      expect(await portrait.getAttribute('width')).toBeTruthy();
      expect(await portrait.getAttribute('height')).toBeTruthy();
    }
  });

  test('ends on a display-type contact link and the social links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const contact = page.locator('[data-home-section="contact"]');
    await expect(contact.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute(
      'href',
      '/contact-me'
    );
    await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', /github\.com/);
    await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', /linkedin\.com/);
    await expect(contact.locator('form')).toHaveCount(0);
  });

  test('has none of the retired homepage patterns', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator('[data-count-up]')).toHaveCount(0);
    await expect(page.locator('[data-home-section="metrics"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /holds up after the demo/i })).toHaveCount(0);
    const numbered = await page
      .locator('.home h1, .home h2, .home h3, .home p')
      .evaluateAll((elements) => elements.filter((element) => /^0[1-9]$/.test((element.textContent ?? '').trim())).length);
    expect(numbered).toBe(0);
  });

  for (const viewport of responsiveViewports) {
    test(`stays inside the viewport at ${viewport.name} width`, async ({ page }) => {
      // Given a viewport
      await page.setViewportSize(viewport);

      // When the homepage is rendered
      await page.goto('/', { waitUntil: 'networkidle' });

      // Then nothing overflows horizontally and the sections keep reading order
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

      const tops = await page
        .locator('[data-home-section]')
        .evaluateAll((elements) =>
          elements.map((element) => [
            element.getAttribute('data-home-section'),
            element.getBoundingClientRect().top + window.scrollY,
          ])
        );
      expect(tops.map(([name]) => name)).toEqual(['hero', 'work', 'writing', 'stage', 'contact']);
      const offsets = tops.map(([, top]) => Number(top));
      expect(offsets).toEqual([...offsets].sort((a, b) => a - b));

      // And the ask controls are big enough to tap
      const field = await page.locator('#home-ask-q').boundingBox();
      const button = await page.locator('[data-home-ask] button').boundingBox();
      expect(field?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(button?.height ?? 0).toBeGreaterThanOrEqual(44);
    });
  }

  test('sends the question to /ask when submitted', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.locator('#home-ask-q').fill('What is Understory');
    await page.locator('[data-home-ask] button').click();

    await expect(page).toHaveURL(/\/ask(\?q=What\+is\+Understory|#q=What%20is%20Understory)$/);
  });

  test('keeps the hero accessible and actionable', async ({ page }) => {
    // Given the homepage is rendered with its interactive shell
    await page.goto('/', { waitUntil: 'networkidle' });

    // When a visitor tabs to the primary action and uses the theme control
    const primaryAction = page.locator('[data-home-ask] button');
    await primaryAction.focus();

    // Then actions have visible focus, and the theme remains operational
    expect(
      await primaryAction.evaluate((element) => getComputedStyle(element).outlineStyle)
    ).not.toBe('none');

    const backgroundBefore = await page
      .locator('[data-home-ledger]')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    const backgroundAfter = await page
      .locator('[data-home-ledger]')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(backgroundAfter).not.toBe(backgroundBefore);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('[data-axe-ignore]')
      .analyze();
    expect(results.violations.filter((violation) => violation.impact === 'critical')).toHaveLength(0);
  });

  test('keeps theme access inside the mobile panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/professional-dark|professional-light/);
  });
});

test.describe('pinned-poster homepage without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows all content and submits the ask form as a plain GET', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Piyush Mehta ships AI tools.');
    await expect(page.locator('.work .panel')).toHaveCount(5);
    await expect(page.locator('[data-writing] [data-row]').first()).toBeVisible();
    await expect(page.locator('[data-writing] [data-cover-img="0"]')).toHaveClass(/is-active/);
    await expect(page.locator('[data-home-section="stage"] .portrait img').first()).toBeAttached();
    await expect(page.locator('[data-reveal].reveal-pending')).toHaveCount(0);
    await expect(page.locator('[data-hero] .hero-stage')).toHaveCSS('position', 'static');

    await page.locator('#home-ask-q').fill('hello');
    await page.locator('[data-home-ask] button').click();
    await expect(page).toHaveURL(/\/ask\?q=hello$/);
  });
});
