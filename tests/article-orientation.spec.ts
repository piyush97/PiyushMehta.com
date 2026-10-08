import { expect, test } from '@playwright/test';

const articlePath = '/blog/rag-vs-long-context/';
const headingLinkText = 'When RAG is worth adding';

test('Luna decision walkthrough routes fixtures at the exact probability threshold', async ({ page }) => {
  await page.goto('/blog/gpt-6-luna-decisions/', { waitUntil: 'domcontentloaded' });
  const demo = page.locator('[data-luna-demo]');
  await expect(demo).toHaveAttribute('data-initialized', 'true');
  const ticket = demo.getByLabel('Support ticket');
  const threshold = demo.getByRole('slider', { name: 'Auto-route threshold' });
  await expect(demo).toHaveAttribute('data-review', 'false');
  await expect(demo.getByRole('meter', { name: 'Billing probability' })).toHaveAttribute('value', '0.94');

  await threshold.focus();
  await threshold.press('End');
  await expect(demo).toHaveAttribute('data-review', 'true');
  for (let step = 0; step < 5; step++) await threshold.press('ArrowLeft');
  await expect(threshold).toHaveValue('94');
  await expect(demo).toHaveAttribute('data-review', 'false');
  await threshold.press('ArrowRight');
  await expect(demo).toHaveAttribute('data-review', 'true');

  await ticket.selectOption({ label: 'Likely technical issue' });
  await expect(demo.getByRole('meter', { name: 'Technical probability' })).toHaveAttribute('value', '0.82');
  await expect(demo).toHaveAttribute('data-review', 'true');
  await threshold.press('Home');
  await expect(demo).toHaveAttribute('data-review', 'false');

  await ticket.selectOption({ label: 'Ambiguous account request' });
  await expect(demo.getByRole('meter', { name: 'Account probability' })).toHaveAttribute('value', '0.52');
  await expect(demo).toHaveAttribute('data-review', 'false');
  await threshold.press('ArrowRight');
  await threshold.press('ArrowRight');
  await expect(threshold).toHaveValue('52');
  await expect(demo).toHaveAttribute('data-review', 'false');
  await threshold.press('ArrowRight');
  await expect(demo).toHaveAttribute('data-review', 'true');
});

test.describe('article orientation and heading-derived table of contents', () => {
  test('renders factual orientation and a bounded desktop rail from Astro headings', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(articlePath, { waitUntil: 'domcontentloaded' });

    const orientation = page.locator('[data-article-orientation]');
    await expect(orientation).toBeVisible();
    await expect(orientation).toHaveAttribute('data-pagefind-ignore', '');
    await expect(orientation.locator('[data-orientation-description]')).toHaveText(
      'RAG vs long context is not either/or. A practical decision framework with real tradeoffs and patterns for using retrieval and long context together.',
    );
    await expect(orientation.locator('[data-orientation-reading-time]')).toHaveText('11 min read');
    await expect(orientation.locator('[data-orientation-section-count]')).toHaveText('17 sections');

    const desktopToc = page.locator('[data-article-toc="desktop"]');
    const mobileToc = page.locator('[data-article-toc="mobile"]');
    await expect(desktopToc).toBeVisible();
    await expect(desktopToc).toHaveAttribute('data-pagefind-ignore', '');
    await expect(mobileToc).toBeHidden();
    await expect(mobileToc).toHaveAttribute('data-pagefind-ignore', '');

    const articleHeadings = await page
      .locator('.blog-post-content :is(h2, h3)')
      .evaluateAll((elements) =>
        elements.map((element) => ({
          depth: Number(element.tagName.slice(1)),
          id: element.id,
          text: element.textContent?.trim() ?? '',
        })),
      );
    const tocEntries = await desktopToc.locator('a[data-toc-depth]').evaluateAll((links) =>
      links.map((link) => ({
        depth: Number(link.getAttribute('data-toc-depth')),
        href: link.getAttribute('href'),
        text: link.textContent?.trim() ?? '',
      })),
    );

    expect(articleHeadings).toHaveLength(17);
    expect(tocEntries).toEqual(
      articleHeadings.map((heading) => ({
        depth: heading.depth,
        href: `#${heading.id}`,
        text: heading.text,
      })),
    );
    expect(tocEntries.every(({ depth }) => depth === 2 || depth === 3)).toBe(true);

    for (const { href } of tocEntries) {
      expect(href).not.toBeNull();
      if (href !== null) {
        await expect(page.locator(`[id="${href.slice(1)}"]`)).toHaveCount(1);
      }
    }

    const depthTwoPadding = await desktopToc
      .locator('[data-toc-depth="2"]')
      .first()
      .evaluate((link) => Number.parseFloat(getComputedStyle(link).paddingInlineStart));
    const depthThreePadding = await desktopToc
      .locator('[data-toc-depth="3"]')
      .first()
      .evaluate((link) => Number.parseFloat(getComputedStyle(link).paddingInlineStart));
    expect(depthThreePadding).toBeGreaterThan(depthTwoPadding);

    const railStyles = await desktopToc.evaluate((rail) => {
      const styles = getComputedStyle(rail);
      return {
        maxHeight: styles.maxHeight,
        overflowY: styles.overflowY,
        position: styles.position,
      };
    });
    expect(railStyles.position).toBe('sticky');
    expect(railStyles.overflowY).toBe('auto');
    expect(railStyles.maxHeight).not.toBe('none');

  });

  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 375, height: 812 },
  ] as const) {
    test(`uses a keyboard-operable native disclosure at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(articlePath, { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-article-toc="desktop"]')).toBeHidden();
      const disclosure = page.locator('details[data-article-toc="mobile"]');
      const summary = disclosure.locator('summary');
      await expect(disclosure).toBeVisible();
      await expect(disclosure).not.toHaveAttribute('open', '');

      await summary.focus();
      await expect(summary).toBeFocused();
      await summary.press('Enter');
      await expect(disclosure).toHaveAttribute('open', '');

      const targetLink = disclosure.getByRole('link', { name: headingLinkText, exact: true });
      await targetLink.focus();
      await expect(targetLink).toBeFocused();
      await Promise.all([
        page.waitForURL(/#when-rag-is-worth-adding$/),
        targetLink.click(),
      ]);

      await expect
        .poll(() =>
          page.locator('#when-rag-is-worth-adding').evaluate((heading) => heading.getBoundingClientRect().top),
        )
        .toBeLessThan(viewport.height);
      const targetPosition = await page.locator('#when-rag-is-worth-adding').evaluate((heading) => {
        const rect = heading.getBoundingClientRect();
        return { bottom: rect.bottom, top: rect.top };
      });
      expect(targetPosition.top).toBeGreaterThanOrEqual(80);
      expect(targetPosition.bottom).toBeGreaterThan(0);

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test('marks the current section in the desktop rail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(articlePath, { waitUntil: 'networkidle' });

    const toc = page.locator('[data-article-toc="desktop"]');
    await expect(toc.locator('a[aria-current="location"]')).toHaveCount(1);

    await page.evaluate((targetId) => {
      document.documentElement.style.scrollBehavior = 'auto';
      const target = document.getElementById(targetId);
      if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 100);
    }, 'when-rag-is-worth-adding');

    await expect
      .poll(() => toc.locator('a[aria-current="location"]').getAttribute('href'))
      .toBe('#when-rag-is-worth-adding');
  });

  test('keeps a late active section inside the desktop rail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto(articlePath, { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const target = document.getElementById('start-with-a-comparison');
      if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 100);
    });

    const rail = page.locator('[data-article-toc="desktop"]');
    const active = rail.locator('a[aria-current="location"]');
    await expect.poll(() => active.getAttribute('href')).toBe('#start-with-a-comparison');

    const metrics = await rail.evaluate((element) => {
      const link = element.querySelector('a[aria-current="location"]');
      const railBounds = element.getBoundingClientRect();
      const linkBounds = link?.getBoundingClientRect();
      return {
        scrollTop: element.scrollTop,
        railTop: railBounds.top,
        railBottom: railBounds.bottom,
        linkTop: linkBounds?.top ?? Number.NaN,
        linkBottom: linkBounds?.bottom ?? Number.NaN,
      };
    });

    expect(metrics.scrollTop).toBeGreaterThan(0);
    expect(metrics.linkTop).toBeGreaterThanOrEqual(metrics.railTop - 1);
    expect(metrics.linkBottom).toBeLessThanOrEqual(metrics.railBottom + 1);
  });

  test('keeps the active TOC state singular across client-side article navigation', async ({ page }) => {
    await page.goto(articlePath, { waitUntil: 'networkidle' });
    const nextRead = page.locator('[data-next-best-read] a');
    const nextHref = await nextRead.getAttribute('href');

    await nextRead.click();
    await expect(page).toHaveURL(new RegExp(`${nextHref?.replaceAll('/', '\\/')}$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${articlePath.replaceAll('/', '\\/')}$`));

    await expect(page.locator('[data-article-toc="desktop"] a[aria-current="location"]')).toHaveCount(1);
  });

  test('keeps orientation but omits empty TOC presentations for a heading-free article', async ({
    page,
  }) => {
    await page.goto('/blog/chat-bot/', { waitUntil: 'domcontentloaded' });

    const orientation = page.locator('[data-article-orientation]');
    await expect(orientation).toBeVisible();
    await expect(orientation.locator('[data-orientation-description]')).toContainText(
      'Creating a ChatGPT-like bot using Azure Bot SDK and Typescript',
    );
    await expect(orientation.locator('[data-orientation-reading-time]')).toContainText('min read');
    await expect(orientation.locator('[data-orientation-section-count]')).toHaveText('0 sections');
    await expect(page.locator('[data-article-toc]')).toHaveCount(0);
  });

  test('keeps Bloom filter controls and bit cells usable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto('/blog/bloom-filters/', { waitUntil: 'networkidle' });

    const controls = page.locator('.bloom-filter-control-row');
    await expect(controls).toHaveCount(2);
    await expect
      .poll(() =>
        controls.evaluateAll((rows) =>
          Math.min(
            ...rows.flatMap((row) =>
              [...row.querySelectorAll('input,button')].map((control) => control.getBoundingClientRect().width),
            ),
          ),
        ),
      )
      .toBeGreaterThanOrEqual(160);

    const bits = page.locator('.bloom-filter-bit');
    await expect(bits).toHaveCount(8);
    const bitDimensions = await bits.evaluateAll((cells) =>
      cells.map((cell) => {
        const bounds = cell.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }),
    );
    expect(
      bitDimensions.every(({ width, height }) => width >= 44 && height >= 44 && Math.abs(width - height) <= 1),
    ).toBe(true);
  });

  for (const articlePath of [
    '/blog/bloom-filters/',
    '/blog/how-to-make-your-own-blog/',
    '/blog/macos-to-arch-linux-omarchy-developer-productivity/',
  ]) {
    test(`keeps interactive article content inside a narrow viewport: ${articlePath}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 812 });
      await page.goto(articlePath, { waitUntil: 'networkidle' });

      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
        )
        .toBe(false);
    });
  }
});
