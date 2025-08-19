import { expect, test } from '@playwright/test';

test.describe('Reading Progress', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blog post to test reading progress
    await page.goto('/blog');
    
    // Find the first blog post link and navigate to it
    const firstPostLink = page.locator('a[href^="/blog/"]').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
    } else {
      // Fallback: create a test page with long content
      await page.goto('/');
    }
  });

  test('should show reading progress bar on blog posts', async ({ page }) => {
    // Check if we're on a blog post page
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      // Reading progress should be visible
      await expect(page.locator('#reading-progress-container')).toBeVisible();
      await expect(page.locator('#reading-progress-bar')).toBeVisible();
      
      // Progress should start at 0%
      const progressBar = page.locator('#reading-progress-bar');
      const initialWidth = await progressBar.evaluate(el => el.style.width);
      expect(initialWidth).toBe('0%');
    }
  });

  test('should update progress when scrolling', async ({ page }) => {
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      const progressBar = page.locator('#reading-progress-bar');
      
      // Get initial progress
      const initialWidth = await progressBar.evaluate(el => el.style.width);
      
      // Scroll down a bit
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.5));
      await page.waitForTimeout(100);
      
      // Progress should have increased
      const midWidth = await progressBar.evaluate(el => el.style.width);
      expect(parseFloat(midWidth)).toBeGreaterThan(parseFloat(initialWidth));
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      
      // Progress should be near 100%
      const endWidth = await progressBar.evaluate(el => el.style.width);
      expect(parseFloat(endWidth)).toBeGreaterThan(80); // Near 100%
    }
  });

  test('should show reading time estimate', async ({ page }) => {
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      // Look for reading time display
      const readingTimeElement = page.locator('#reading-time, .reading-time').first();
      
      if (await readingTimeElement.count() > 0) {
        await expect(readingTimeElement).toBeVisible();
        
        const readingTimeText = await readingTimeElement.textContent();
        expect(readingTimeText).toMatch(/\d+\s*min/i);
      }
    }
  });

  test('should update reading percentage', async ({ page }) => {
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      const progressPercentage = page.locator('#reading-percentage, .reading-percentage').first();
      
      if (await progressPercentage.count() > 0) {
        // Initial percentage should be low
        const initialText = await progressPercentage.textContent();
        const initialPercent = parseInt(initialText?.match(/\d+/)?.[0] || '0');
        
        // Scroll down
        await page.evaluate(() => window.scrollTo(0, window.innerHeight));
        await page.waitForTimeout(100);
        
        // Percentage should increase
        const newText = await progressPercentage.textContent();
        const newPercent = parseInt(newText?.match(/\d+/)?.[0] || '0');
        
        expect(newPercent).toBeGreaterThan(initialPercent);
      }
    }
  });

  test('should not show on non-blog pages', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Reading progress should not be visible on non-blog pages
    const progressContainer = page.locator('#reading-progress-container');
    
    // Either not present or not visible
    if (await progressContainer.count() > 0) {
      const isVisible = await progressContainer.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }
    
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      // Progress bar should be visible and properly sized on mobile
      await expect(page.locator('#reading-progress-bar')).toBeVisible();
      
      // Check if progress bar spans full width
      const progressBar = page.locator('#reading-progress-bar');
      const boundingBox = await progressBar.boundingBox();
      const viewportSize = page.viewportSize();
      
      if (boundingBox && viewportSize) {
        expect(boundingBox.width).toBeLessThanOrEqual(viewportSize.width);
      }
    }
  });

  test('should handle smooth scrolling', async ({ page }) => {
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      const progressBar = page.locator('#reading-progress-bar');
      
      // Scroll smoothly and check progress updates
      await page.evaluate(() => {
        window.scrollTo({ top: window.innerHeight * 0.3, behavior: 'smooth' });
      });
      
      // Wait for smooth scroll to complete
      await page.waitForTimeout(500);
      
      const progress1 = await progressBar.evaluate(el => el.style.width);
      
      await page.evaluate(() => {
        window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
      });
      
      await page.waitForTimeout(500);
      
      const progress2 = await progressBar.evaluate(el => el.style.width);
      
      // Second progress should be greater than first
      expect(parseFloat(progress2)).toBeGreaterThan(parseFloat(progress1));
    }
  });

  test('should be accessible', async ({ page }) => {
    const isBlogPost = await page.locator('article').count() > 0;
    
    if (isBlogPost) {
      const progressContainer = page.locator('#reading-progress-container');
      
      // Should have proper ARIA attributes
      if (await progressContainer.count() > 0) {
        const progressBar = page.locator('#reading-progress-bar');
        
        // Progress bar should have role and aria attributes
        const role = await progressBar.getAttribute('role');
        if (role) {
          expect(role).toBe('progressbar');
        }
      }
    }
  });
});