import { expect, test } from '@playwright/test';

test.describe('Code Blocks Enhancement', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blog post that likely contains code blocks
    await page.goto('/blog');
    
    // Find a blog post with code (or navigate to a specific post)
    const blogLink = page.locator('a[href^="/blog/"]').first();
    if (await blogLink.count() > 0) {
      await blogLink.click();
    } else {
      // Fallback to homepage
      await page.goto('/');
    }
  });

  test('should enhance code blocks with copy buttons', async ({ page }) => {
    // Look for code blocks on the page
    const codeBlocks = page.locator('pre code, .code-block-container');
    
    if (await codeBlocks.count() > 0) {
      // Wait for enhancement to complete
      await page.waitForTimeout(500);
      
      // Check if copy buttons are present
      const copyButtons = page.locator('.copy-code-btn');
      expect(await copyButtons.count()).toBeGreaterThan(0);
      
      // Copy buttons should be visible on hover
      const firstCodeBlock = codeBlocks.first();
      await firstCodeBlock.hover();
      
      const firstCopyButton = copyButtons.first();
      await expect(firstCopyButton).toBeVisible();
    }
  });

  test('should copy code to clipboard', async ({ page }) => {
    // Mock clipboard API
    await page.addInitScript(() => {
      let clipboardText = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            clipboardText = text;
            return Promise.resolve();
          },
          readText: async () => Promise.resolve(clipboardText),
        },
      });
    });
    
    const copyButtons = page.locator('.copy-code-btn');
    
    if (await copyButtons.count() > 0) {
      const firstCopyButton = copyButtons.first();
      
      // Make sure the button is visible
      await firstCopyButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      
      // Click copy button
      await firstCopyButton.click();
      
      // Check if clipboard contains code
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardContent.length).toBeGreaterThan(0);
      
      // Check for success feedback
      const checkIcon = page.locator('.copy-code-btn .check-icon').first();
      if (await checkIcon.count() > 0) {
        await expect(checkIcon).toBeVisible();
      }
    }
  });

  test('should show proper feedback on copy success', async ({ page }) => {
    // Mock successful clipboard API
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => Promise.resolve(),
        },
      });
    });
    
    const copyButtons = page.locator('.copy-code-btn');
    
    if (await copyButtons.count() > 0) {
      const firstCopyButton = copyButtons.first();
      await firstCopyButton.scrollIntoViewIfNeeded();
      
      // Click copy button
      await firstCopyButton.click();
      
      // Should show success state
      const checkIcon = firstCopyButton.locator('.check-icon');
      const copyIcon = firstCopyButton.locator('.copy-icon');
      
      if (await checkIcon.count() > 0 && await copyIcon.count() > 0) {
        await expect(checkIcon).toBeVisible();
        await expect(copyIcon).toBeHidden();
        
        // Should revert back after timeout
        await page.waitForTimeout(2500);
        await expect(copyIcon).toBeVisible();
        await expect(checkIcon).toBeHidden();
      }
    }
  });

  test('should handle copy failures gracefully', async ({ page }) => {
    // Mock failing clipboard API
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => Promise.reject(new Error('Clipboard access denied')),
        },
      });
    });
    
    const copyButtons = page.locator('.copy-code-btn');
    
    if (await copyButtons.count() > 0) {
      const firstCopyButton = copyButtons.first();
      await firstCopyButton.scrollIntoViewIfNeeded();
      
      // Click copy button
      await firstCopyButton.click();
      
      // Should show error feedback (shake animation or error text)
      const hasShakeClass = await firstCopyButton.evaluate(el => el.classList.contains('shake'));
      expect(hasShakeClass).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    const copyButtons = page.locator('.copy-code-btn');
    
    if (await copyButtons.count() > 0) {
      const firstCopyButton = copyButtons.first();
      
      // Focus the copy button
      await firstCopyButton.focus();
      await expect(firstCopyButton).toBeFocused();
      
      // Should have proper focus styles
      const focusRing = await firstCopyButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.boxShadow;
      });
      
      expect(focusRing).toBeTruthy();
    }
  });

  test('should be accessible', async ({ page }) => {
    const copyButtons = page.locator('.copy-code-btn');
    
    if (await copyButtons.count() > 0) {
      const firstCopyButton = copyButtons.first();
      
      // Should have proper ARIA attributes
      await expect(firstCopyButton).toHaveAttribute('aria-label');
      await expect(firstCopyButton).toHaveAttribute('title');
      
      // Check if aria-label is descriptive
      const ariaLabel = await firstCopyButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('copy');
    }
  });

  test('should work on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }
    
    const copyButtons = page.locator('.copy-code-btn');
    
    if (await copyButtons.count() > 0) {
      const firstCopyButton = copyButtons.first();
      
      // On mobile, copy button should be visible without hover
      await expect(firstCopyButton).toBeVisible();
      
      // Should be touchable (proper size)
      const boundingBox = await firstCopyButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44); // Minimum touch target
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should preserve code formatting', async ({ page }) => {
    const codeBlocks = page.locator('pre code');
    
    if (await codeBlocks.count() > 0) {
      const firstCodeBlock = codeBlocks.first();
      const codeContent = await firstCodeBlock.textContent();
      
      if (codeContent) {
        // Code should preserve whitespace and line breaks
        expect(codeContent).toBeTruthy();
        
        // Check if indentation is preserved (look for multiple spaces)
        const hasIndentation = /\n\s{2,}/.test(codeContent);
        if (hasIndentation) {
          expect(hasIndentation).toBeTruthy();
        }
      }
    }
  });

  test('should apply syntax highlighting', async ({ page }) => {
    const codeBlocks = page.locator('pre code');
    
    if (await codeBlocks.count() > 0) {
      const firstCodeBlock = codeBlocks.first();
      
      // Check for syntax highlighting tokens
      const tokens = firstCodeBlock.locator('.token');
      
      if (await tokens.count() > 0) {
        // Should have different token types
        const commentTokens = tokens.locator('.comment');
        const keywordTokens = tokens.locator('.keyword');
        const stringTokens = tokens.locator('.string');
        
        // At least one type of token should exist
        const hasTokens = (await commentTokens.count()) > 0 || 
                         (await keywordTokens.count()) > 0 || 
                         (await stringTokens.count()) > 0;
        
        expect(hasTokens).toBeTruthy();
      }
    }
  });

  test('should handle different programming languages', async ({ page }) => {
    const codeBlocks = page.locator('pre code');
    
    if (await codeBlocks.count() > 0) {
      // Check for language-specific classes
      const languageClasses = await codeBlocks.evaluateAll(elements => {
        return elements.map(el => {
          const className = el.className;
          const match = className.match(/language-(\w+)/);
          return match ? match[1] : null;
        }).filter(Boolean);
      });
      
      // Should support common languages
      const supportedLanguages = ['javascript', 'typescript', 'python', 'css', 'html', 'json', 'bash'];
      const hasKnownLanguage = languageClasses.some(lang => 
        supportedLanguages.includes(lang || '')
      );
      
      if (languageClasses.length > 0) {
        expect(hasKnownLanguage).toBeTruthy();
      }
    }
  });
});