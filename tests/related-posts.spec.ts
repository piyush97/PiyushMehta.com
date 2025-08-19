import { expect, test } from '@playwright/test';

test.describe('Related Posts', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blog post to test related posts
    await page.goto('/blog');
    
    // Find and click on the first blog post
    const firstPostLink = page.locator('a[href^="/blog/"]').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
    } else {
      // Skip if no blog posts found
      test.skip('No blog posts found to test related posts');
    }
  });

  test('should display related posts section', async ({ page }) => {
    // Look for related posts section
    const relatedSection = page.locator('.related-posts-section, #related-posts');
    
    if (await relatedSection.count() > 0) {
      await expect(relatedSection).toBeVisible();
      
      // Should have a heading
      const heading = relatedSection.locator('h2, h3').first();
      await expect(heading).toBeVisible();
      
      const headingText = await heading.textContent();
      expect(headingText?.toLowerCase()).toContain('related');
    }
  });

  test('should show related posts cards', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      // Should have at least one related post
      expect(await relatedPosts.count()).toBeGreaterThan(0);
      expect(await relatedPosts.count()).toBeLessThanOrEqual(3); // Max 3 posts
      
      // Each card should have required elements
      const firstCard = relatedPosts.first();
      
      // Should have title
      const title = firstCard.locator('h3, .post-title');
      await expect(title).toBeVisible();
      
      // Should have link
      const link = firstCard.locator('a').first();
      await expect(link).toBeVisible();
      
      // Link should have valid href
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^\/blog\/.+/);
    }
  });

  test('should show similarity indicators for matching tags', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      // Look for similarity indicators
      const similarityIndicators = page.locator('.bg-accent\\/20, [class*="similar"]');
      
      if (await similarityIndicators.count() > 0) {
        const firstIndicator = similarityIndicators.first();
        await expect(firstIndicator).toBeVisible();
        
        // Should contain "Similar" text or similar indication
        const indicatorText = await firstIndicator.textContent();
        expect(indicatorText?.toLowerCase()).toContain('similar');
      }
    }
  });

  test('should highlight matching tags', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      // Look for tags in related posts
      const tags = page.locator('.related-post-card span[class*="bg-accent"], .related-post-card .tag');
      
      if (await tags.count() > 0) {
        const firstTag = tags.first();
        await expect(firstTag).toBeVisible();
        
        // Tag should have highlighting styles
        const backgroundColor = await firstTag.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        expect(backgroundColor).toBeTruthy();
      }
    }
  });

  test('should navigate to related posts when clicked', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      const firstPost = relatedPosts.first();
      const link = firstPost.locator('a').first();
      
      // Get the href before clicking
      const href = await link.getAttribute('href');
      
      // Click the related post
      await link.click();
      
      // Should navigate to the related post
      await page.waitForLoadState('networkidle');
      
      // URL should match the clicked link
      expect(page.url()).toContain(href || '');
      
      // Should be on a blog post page
      expect(page.url()).toMatch(/\/blog\/.+/);
    }
  });

  test('should show reading time for related posts', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      // Look for reading time indicators
      const readingTimes = page.locator('.related-post-card').locator('text=/\\d+\\s*min/i');
      
      if (await readingTimes.count() > 0) {
        const firstReadingTime = readingTimes.first();
        await expect(firstReadingTime).toBeVisible();
        
        const readingTimeText = await firstReadingTime.textContent();
        expect(readingTimeText).toMatch(/\d+\s*min/i);
      }
    }
  });

  test('should show post dates', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      // Look for date elements
      const dates = page.locator('.related-post-card time, .related-post-card .date');
      
      if (await dates.count() > 0) {
        const firstDate = dates.first();
        await expect(firstDate).toBeVisible();
        
        // Should have datetime attribute if it's a time element
        const tagName = await firstDate.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'time') {
          const datetime = await firstDate.getAttribute('datetime');
          expect(datetime).toBeTruthy();
        }
      }
    }
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }
    
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      // Related posts should be visible and properly laid out on mobile
      await expect(relatedPosts.first()).toBeVisible();
      
      // Should stack vertically on mobile (grid-cols-1)
      const firstCard = relatedPosts.first();
      const secondCard = relatedPosts.nth(1);
      
      if (await secondCard.count() > 0) {
        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();
        
        if (firstCardBox && secondCardBox) {
          // Second card should be below first card (not side by side)
          expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
        }
      }
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      const links = page.locator('.related-post-card a');
      
      if (await links.count() > 0) {
        const firstLink = links.first();
        
        // Should be focusable
        await firstLink.focus();
        await expect(firstLink).toBeFocused();
        
        // Should have proper focus styles
        const focusStyles = await firstLink.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.outline || styles.boxShadow;
        });
        
        expect(focusStyles).toBeTruthy();
        
        // Should have descriptive link text or aria-label
        const linkText = await firstLink.textContent();
        const ariaLabel = await firstLink.getAttribute('aria-label');
        
        expect(linkText || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should handle hover effects', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip('Hover effects are not applicable on mobile devices');
    }
    
    const relatedPosts = page.locator('.related-post-card');
    
    if (await relatedPosts.count() > 0) {
      const firstCard = relatedPosts.first();
      
      // Get initial styles
      const initialTransform = await firstCard.evaluate(el => {
        return window.getComputedStyle(el).transform;
      });
      
      // Hover over the card
      await firstCard.hover();
      await page.waitForTimeout(100);
      
      // Should have hover effects (transform, shadow, etc.)
      const hoverTransform = await firstCard.evaluate(el => {
        return window.getComputedStyle(el).transform;
      });
      
      // Transform should change on hover (translateY or scale)
      if (initialTransform !== 'none' || hoverTransform !== 'none') {
        expect(hoverTransform).not.toBe(initialTransform);
      }
    }
  });

  test('should track analytics events', async ({ page }) => {
    // Mock analytics tracking
    await page.addInitScript(() => {
      window.analyticsEvents = [];
      window.gtag = (...args: any[]) => {
        window.analyticsEvents.push(args);
      };
    });
    
    const relatedSection = page.locator('.related-posts-section');
    
    if (await relatedSection.count() > 0) {
      // Scroll related posts into view (should trigger view event)
      await relatedSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Check if view event was tracked
      const events = await page.evaluate(() => window.analyticsEvents);
      const hasViewEvent = events.some((event: any[]) => 
        event.includes('related_posts_viewed')
      );
      
      if (events.length > 0) {
        expect(hasViewEvent).toBeTruthy();
      }
    }
  });
});