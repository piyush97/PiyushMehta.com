import { expect, test } from '@playwright/test';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open command palette with Cmd+K', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // Check if command palette is visible
    await expect(page.locator('#command-palette')).toBeVisible();
    await expect(page.locator('#command-search')).toBeFocused();
  });

  test('should open command palette with Ctrl+K', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Control+KeyK');
    
    // Check if command palette is visible
    await expect(page.locator('#command-palette')).toBeVisible();
    await expect(page.locator('#command-search')).toBeFocused();
  });

  test('should close command palette with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    await expect(page.locator('#command-palette')).toBeVisible();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#command-palette')).not.toBeVisible();
  });

  test('should filter quick actions when typing', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // Type to filter
    await page.locator('#command-search').fill('theme');
    
    // Should show theme toggle action
    await expect(page.locator('.command-item').filter({ hasText: 'Toggle Theme' })).toBeVisible();
    
    // Should hide other actions
    await expect(page.locator('.command-item').filter({ hasText: 'Copy URL' })).not.toBeVisible();
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // First item should be highlighted by default
    await expect(page.locator('.command-item.highlighted').first()).toBeVisible();
    
    // Navigate down
    await page.keyboard.press('ArrowDown');
    
    // Second item should now be highlighted
    const highlightedItems = page.locator('.command-item.highlighted');
    await expect(highlightedItems).toHaveCount(1);
  });

  test('should execute theme toggle action', async ({ page }) => {
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('professional-light') ? 'light' : 'dark';
    });
    
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // Find and click theme toggle
    await page.locator('.command-item').filter({ hasText: 'Toggle Theme' }).click();
    
    // Check if theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('professional-light') ? 'light' : 'dark';
    });
    
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should execute copy URL action', async ({ page }) => {
    // Mock clipboard API
    await page.addInitScript(() => {
      let clipboardText = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            clipboardText = text;
          },
          readText: async () => clipboardText,
        },
      });
    });
    
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // Find and click copy URL action
    await page.locator('.command-item').filter({ hasText: 'Copy URL' }).click();
    
    // Verify clipboard contains the page URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('localhost:4321');
  });

  test('should search blog content', async ({ page }) => {
    // Navigate to a page with blog content
    await page.goto('/blog');
    
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // Type a search query
    await page.locator('#command-search').fill('react');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Should show search results section
    await expect(page.locator('.search-results')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+KeyK');
    
    // Check ARIA attributes
    await expect(page.locator('#command-palette')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#command-palette')).toHaveAttribute('aria-labelledby', 'command-palette-title');
    await expect(page.locator('#command-search')).toHaveAttribute('aria-label', 'Search commands and content');
    
    // Check focus management
    await expect(page.locator('#command-search')).toBeFocused();
  });

  test('should work on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }
    
    // On mobile, command palette should open with search button
    await page.locator('.search-btn, [aria-label*="search"]').click();
    
    // Should be visible and responsive
    await expect(page.locator('#command-palette')).toBeVisible();
    await expect(page.locator('#command-search')).toBeFocused();
  });
});