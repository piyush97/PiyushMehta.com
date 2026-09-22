import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const responsiveViewports = [
  { name: 'small mobile', width: 320, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
] as const;

test.describe('approved homepage revamp', () => {
  test('renders the approved evidence-led hero', async ({ page }) => {
    // Given the homepage is opened at the approved desktop reference size
    await page.setViewportSize({ width: 1672, height: 941 });

    // When the first viewport finishes rendering
    await page.goto('/', { waitUntil: 'networkidle' });

    // Then the approved copy, case-study record, portrait, and metric rail are present
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Software that holds up after the demo.'
    );
    await expect(page.getByRole('link', { name: 'Review 3 case studies' })).toHaveAttribute(
      'href',
      '/projects/'
    );
    await expect(page.getByRole('link', { name: 'Read Résumé' })).toHaveAttribute(
      'href',
      '/resume/'
    );

    const evidenceRecord = page.locator('[data-home-section="evidence"]');
    await expect(evidenceRecord.getByRole('heading', { name: 'Enterprise AI Workflows' })).toBeVisible();
    await expect(evidenceRecord.getByText('Constraint — fragmented manual processes')).toBeVisible();
    await expect(
      evidenceRecord.getByText('Decision — workflow-first AI with security guardrails')
    ).toBeVisible();
    await expect(evidenceRecord.getByText('Outcome — 30% greater workflow efficiency')).toBeVisible();
    await expect(evidenceRecord.getByRole('link', { name: 'View case study' })).toHaveAttribute(
      'href',
      '/projects/'
    );

    const metrics = page.locator('[data-home-section="metrics"]');
    await expect(metrics.locator('article')).toHaveCount(3);
    await expect(metrics.getByText('Enterprise AI workflow delivery')).toBeVisible();
    await expect(metrics.getByText('Secure engineering and review programs')).toBeVisible();
    await expect(
      metrics.getByText('Workshops, community, and technical education')
    ).toBeVisible();
  });

  for (const viewport of responsiveViewports) {
    test(`adapts the approved hero without overflow at ${viewport.name} width`, async ({ page }) => {
      // Given a narrow device viewport
      await page.setViewportSize(viewport);

      // When the homepage is rendered
      await page.goto('/', { waitUntil: 'networkidle' });

      // Then the page stays within the viewport and preserves the intended reading order
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

      const orderedSections = page.locator(
        '[data-home-section="intro"], [data-home-section="portrait"], [data-home-section="evidence"], [data-home-section="actions"], [data-home-section="metrics"]'
      );
      await expect(orderedSections).toHaveCount(5);
      const sectionTops = await orderedSections.evaluateAll((elements) =>
        Object.fromEntries(
          elements.map((element) => [
            element.getAttribute('data-home-section'),
            element.getBoundingClientRect().top + window.scrollY,
          ])
        )
      );
      if (viewport.name === 'tablet') {
        expect(sectionTops.intro).toBeLessThan(sectionTops.actions);
        expect(sectionTops.actions).toBeLessThan(sectionTops.portrait);
        expect(sectionTops.portrait).toBeLessThan(sectionTops.evidence);
        expect(sectionTops.evidence).toBeLessThan(sectionTops.metrics);
      } else {
        expect(Object.values(sectionTops)).toEqual(Object.values(sectionTops).sort((a, b) => a - b));
      }

      const actions = page.locator('[data-home-section="actions"] a');
      await expect(actions).toHaveCount(2);
      for (const action of await actions.all()) {
        const box = await action.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }

      const metricCards = page.locator('[data-home-section="metrics"] article');
      await expect(metricCards).toHaveCount(3);
      for (const metric of await metricCards.all()) {
        const box = await metric.boundingBox();
        expect(box?.width ?? 0).toBeLessThanOrEqual(viewport.width);
        expect(
          await metric.evaluate(
            (element) => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight
          )
        ).toBeTruthy();
      }

      if (viewport.width <= 640) {
        const mobileMetrics = await page.locator('[data-home-section="metrics"]').evaluate(
          (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length
        );
        expect(mobileMetrics).toBe(3);
        const actionWidths = await actions.evaluateAll((elements) =>
          elements.map((element) => Math.round(element.getBoundingClientRect().width))
        );
        expect(actionWidths[0]).toBeGreaterThanOrEqual(viewport.width - 32);
        expect(actionWidths[1]).toBeGreaterThanOrEqual(viewport.width - 32);
      }
    });
  }

  test('keeps the hero accessible and actionable', async ({ page }) => {
    // Given the homepage is rendered with its interactive shell
    await page.goto('/', { waitUntil: 'networkidle' });

    // When a visitor uses its actions and theme control
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const primaryAction = page.getByRole('link', { name: 'Review 3 case studies' });
    await primaryAction.focus();

    // Then actions have visible focus, media is described, and the theme remains operational
    expect(
      await primaryAction.evaluate((element) => getComputedStyle(element).outlineStyle)
    ).not.toBe('none');
    await expect(
      page.getByRole('img', { name: 'Piyush Mehta speaking on stage at a developer conference' })
    ).toBeVisible();

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
