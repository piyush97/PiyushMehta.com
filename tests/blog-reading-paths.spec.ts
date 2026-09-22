import { expect, test } from '@playwright/test';

const expectedPaths = [
  {
    intent: 'I need to ship an AI agent safely',
    steps: ['Start with the protocol', 'Inspect the trust boundary', 'Prove the action gate'],
    slugs: [
      'building-mcp-server-typescript',
      'ai-agents-mcp-security-crisis',
      'testing-ai-agent-actions',
    ],
  },
  {
    intent: 'I’m planning a production migration',
    steps: ['Frame the migration', 'Protect the data path', 'Adapt to the new runtime'],
    slugs: [
      'cron-to-event-driven',
      'zero-downtime-database-migration-at-scale',
      'vercel-to-cloudflare-migration',
    ],
  },
  {
    intent: 'I want a better coding-agent workflow',
    steps: ['Give agents context', 'Keep their sessions alive', 'Tighten the desktop loop'],
    slugs: [
      'agents-md-repository-context',
      'herdr-terminal-multiplexer-coding-agents',
      'omaswitch-alt-tab-omarchy',
    ],
  },
] as const;

test.describe('blog intent reading paths', () => {
  test.describe.configure({ mode: 'serial' });

  test('renders three collection-backed journeys in source order', async ({ page, request }) => {
    // Given: the published writing index.
    await page.goto('/blog/', { waitUntil: 'networkidle' });

    // When: a reader inspects the intent-led journeys.
    const paths = page.locator('[data-reading-path]');

    // Then: every approved path and step resolves to one unique published article.
    await expect(paths).toHaveCount(3);
    const linkedSlugs: string[] = [];

    for (const [pathIndex, expectedPath] of expectedPaths.entries()) {
      const path = paths.nth(pathIndex);
      await expect(path.getByRole('heading', { name: expectedPath.intent })).toBeVisible();

      const steps = path.locator('[data-reading-path-step]');
      await expect(steps).toHaveCount(3);

      for (const [stepIndex, slug] of expectedPath.slugs.entries()) {
        const step = steps.nth(stepIndex);
        await expect(step).toHaveAttribute('data-reading-path-step', String(stepIndex + 1));
        await expect(step.getByText(expectedPath.steps[stepIndex])).toBeVisible();

        const link = step.getByRole('link');
        await expect(link).toHaveAttribute('href', `/blog/${slug}/`);
        await expect(link).not.toHaveAttribute('href', /\/projects\//);
        await expect(link).not.toHaveText('');

        const href = await link.getAttribute('href');
        expect(href).toBe(`/blog/${slug}/`);
        linkedSlugs.push(slug);

        const response = await request.get(href ?? '');
        expect(response.ok()).toBe(true);
      }
    }

    expect(new Set(linkedSlugs).size).toBe(9);
  });

  test('opens the second article in each journey with its collection title', async ({ page }) => {
    // Given: each journey's second step at the desktop reading-path layout.
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const [pathIndex, expectedPath] of expectedPaths.entries()) {
      await page.goto('/blog/', { waitUntil: 'networkidle' });
      const link = page
        .locator('[data-reading-path]')
        .nth(pathIndex)
        .locator('[data-reading-path-step]')
        .nth(1)
        .getByRole('link');
      const title = (await link.textContent())?.trim();
      expect(title).toBeTruthy();

      // When: the reader follows that collection-backed link.
      await link.click();

      // Then: the destination article preserves the clicked collection title.
      await expect(page).toHaveURL(`/blog/${expectedPath.slugs[1]}/`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title ?? '');
    }
  });

  for (const viewport of [
    { width: 1280, height: 900, columns: 3 },
    { width: 768, height: 1024, columns: 1 },
    { width: 375, height: 812, columns: 1 },
  ] as const) {
    test(`${viewport.columns} column layout at ${viewport.width}px`, async ({ page }) => {
      // Given: the writing index at a representative viewport.
      await page.setViewportSize(viewport);
      await page.goto('/blog/', { waitUntil: 'networkidle' });

      // When: the reading paths are laid out.
      const grid = page.locator('[data-reading-paths-grid]');
      const links = grid.getByRole('link');

      // Then: the grid, targets, and page remain readable without horizontal overflow.
      await expect(grid.locator('[data-reading-path]')).toHaveCount(3);
      const templateColumns = await grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length
      );
      expect(templateColumns).toBe(viewport.columns);

      for (const link of await links.all()) {
        const box = await link.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }

      const firstLink = links.first();
      await firstLink.focus();
      const focusStyle = await firstLink.evaluate((element) => {
        const styles = getComputedStyle(element);
        return { outlineStyle: styles.outlineStyle, outlineWidth: styles.outlineWidth };
      });
      expect(focusStyle.outlineStyle).not.toBe('none');
      expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2);

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow).toBe(false);

      await grid.evaluate((element) => {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 80 });
      });
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await expect.poll(() => grid.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThanOrEqual(81);
      await page.screenshot({ path: `.omo/evidence/task-1-${viewport.width}.png` });
    });
  }
});
