import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/blog', name: 'blog' },
  { path: '/projects', name: 'projects' },
  { path: '/resume', name: 'resume' },
  { path: '/404', name: '404' },
];

for (const { path, name } of PAGES) {
  test(`${name} has no critical a11y violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('[data-axe-ignore]')
      .analyze();

    expect(
      results.violations.filter((v) => v.impact === 'critical'),
      `Critical a11y violations on ${path}:\n${results.violations
        .filter((v) => v.impact === 'critical')
        .map((v) => `  [${v.id}] ${v.description}`)
        .join('\n')}`
    ).toHaveLength(0);
  });
}

test('blog post has no critical a11y violations', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');

  const firstPost = page.locator('[data-post-card] a').first();
  const href = await firstPost.getAttribute('href');
  if (!href) return;

  await page.goto(href);
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    results.violations.filter((v) => v.impact === 'critical'),
    `Critical a11y violations on blog post:\n${results.violations
      .filter((v) => v.impact === 'critical')
      .map((v) => `  [${v.id}] ${v.description}`)
      .join('\n')}`
  ).toHaveLength(0);
});
