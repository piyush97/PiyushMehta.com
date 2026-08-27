import { expect, test } from '@playwright/test';

/**
 * Behavior contract for inline code chips in blog post body.
 *
 * Inline code (e.g. `ctrl+b q`) must:
 *   1. Render as a styled chip (not raw text on a plain background).
 *   2. Have a background that visually distinguishes it from surrounding prose.
 *   3. Use the accent yellow as the chip's background tint.
 *   4. NOT include literal backtick characters anywhere in the rendered output.
 *      (Tailwind typography injects `code::before { content: "`" }` and the
 *      matching `::after` on inline code by default; this site suppresses them.)
 */
test.describe('Inline code chips in blog posts', () => {
  const SLUGS = [
    'herdr-terminal-multiplexer-coding-agents',
    'omaswitch-alt-tab-omarchy',
    'agents-md-repository-context',
  ];

  for (const slug of SLUGS) {
    test(`renders accent chip without backticks on /blog/${slug}`, async ({ page }) => {
      await page.goto(`/blog/${slug}`);
      const inlineCode = page.locator('.blog-post-content p code').first();
      await expect(inlineCode).toBeVisible();

      // The visible text must not contain backticks. innerText includes
      // ::before/::after content, so this catches the pseudo-element backticks.
      const visibleText = await inlineCode.evaluate((el) => (el as HTMLElement).innerText);
      expect(
        visibleText,
        `inline code contains literal backticks: ${JSON.stringify(visibleText)}`,
      ).not.toContain('`');
    });
  }

  test('renders inline code as an accent-tinted chip without literal backticks', async ({
    page,
  }) => {
    await page.goto('/blog/herdr-terminal-multiplexer-coding-agents');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Runtime');

    // First inline code in the post body: `ctrl+b q` appears in the blockquote.
    const inlineCode = page.locator('.blog-post-content p code').first();
    await expect(inlineCode).toBeVisible();

    // 1. The DOM text node IS the code itself (no leading/trailing junk).
    await expect(inlineCode).toHaveText('ctrl+b q');

    // 2. The rendered visible text must NOT contain backticks.
    const visibleText = await inlineCode.evaluate((el) => (el as HTMLElement).innerText);
    expect(
      visibleText,
      `inline code contains literal backticks: ${JSON.stringify(visibleText)}`,
    ).not.toContain('`');

    // 3. The background must be the accent yellow chip.
    //    Accept either opaque accent or accent-with-alpha (a translucent tint chip).
    const bg = await inlineCode.evaluate((el) => getComputedStyle(el).backgroundColor);
    const m = bg.match(/[\d.]+/g);
    expect(m, `could not parse background-color: ${bg}`).not.toBeNull();
    const [r, g, b, a] = (m as RegExpMatchArray).map(Number);
    if (a !== undefined) {
      expect(a, `background alpha is too transparent: ${bg}`).toBeGreaterThanOrEqual(0.05);
    }
    expect(Math.abs(r - 255), `red channel off: ${bg}`).toBeLessThanOrEqual(5);
    expect(Math.abs(g - 204), `green channel off: ${bg}`).toBeLessThanOrEqual(5);
    expect(Math.abs(b - 104), `blue channel off: ${bg}`).toBeLessThanOrEqual(5);
  });
});
