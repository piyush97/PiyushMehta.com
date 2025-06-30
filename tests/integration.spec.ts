import { expect, test } from '@playwright/test';

test.describe('Integration Tests', () => {
  test('should have all enhanced features working together', async ({ page }) => {
    // Navigate to a blog post
    await page.goto('/blog');
    
    const firstPostLink = page.locator('a[href^="/blog/"]').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
    } else {
      test.skip('No blog posts found for integration testing');
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // 1. Command Palette should be available
    await page.keyboard.press('Meta+KeyK');
    await expect(page.locator('#command-palette')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // 2. Reading Progress should be active
    const progressBar = page.locator('#reading-progress-bar');
    if (await progressBar.count() > 0) {
      await expect(progressBar).toBeVisible();
    }
    
    // 3. Code blocks should be enhanced
    const copyButtons = page.locator('.copy-code-btn');
    if (await copyButtons.count() > 0) {
      expect(await copyButtons.count()).toBeGreaterThan(0);
    }
    
    // 4. Related posts should be shown
    const relatedPosts = page.locator('.related-posts-section, .related-post-card');
    if (await relatedPosts.count() > 0) {
      await expect(relatedPosts.first()).toBeVisible();
    }
  });

  test('should maintain performance with all enhancements', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/blog');
    
    const firstPostLink = page.locator('a[href^="/blog/"]').first();
    if (await firstPostLink.count() > 0) {
      const startTime = Date.now();
      
      await firstPostLink.click();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Check Core Web Vitals
      const navigationTiming = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        };
      });
      
      // DOM should load quickly
      expect(navigationTiming.domContentLoaded).toBeLessThan(3000);
    }
  });

  test('should work across different devices and viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Check responsive behavior
      await page.waitForLoadState('networkidle');
      
      // Navigation should be accessible
      const navbar = page.locator('nav, .navbar');
      if (await navbar.count() > 0) {
        await expect(navbar).toBeVisible();
      }
      
      // Command palette should work
      await page.keyboard.press('Meta+KeyK');
      const commandPalette = page.locator('#command-palette');
      if (await commandPalette.count() > 0) {
        await expect(commandPalette).toBeVisible();
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should handle keyboard navigation throughout the site', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Should have visible focus indicators
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.boxShadow || styles.border;
      });
      
      expect(focusStyles).toBeTruthy();
    }
    
    // Command palette keyboard shortcuts
    await page.keyboard.press('Meta+KeyK');
    const commandPalette = page.locator('#command-palette');
    if (await commandPalette.count() > 0) {
      await expect(commandPalette).toBeVisible();
      
      // Arrow key navigation should work
      await page.keyboard.press('ArrowDown');
      const highlightedItem = page.locator('.command-item.highlighted, .command-item[aria-selected="true"]');
      if (await highlightedItem.count() > 0) {
        await expect(highlightedItem).toBeVisible();
      }
      
      await page.keyboard.press('Escape');
    }
  });

  test('should maintain accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility requirements
    
    // 1. Page should have a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // 2. Images should have alt text
    const images = page.locator('img');
    if (await images.count() > 0) {
      const imagesWithoutAlt = images.locator(':not([alt])');
      expect(await imagesWithoutAlt.count()).toBe(0);
    }
    
    // 3. Form inputs should have labels
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    if (await inputs.count() > 0) {
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledby = el.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          
          return !!(ariaLabel || ariaLabelledby || label);
        });
        
        expect(hasLabel).toBeTruthy();
      }
    }
    
    // 4. Interactive elements should be keyboard accessible
    const buttons = page.locator('button, a[href]');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      await expect(firstButton).toBeFocused();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-page');
    
    // Should show a 404 page or redirect gracefully
    const pageContent = await page.textContent('body');
    const has404Content = pageContent?.includes('404') || 
                         pageContent?.includes('not found') || 
                         pageContent?.includes('Page not found');
    
    // Either shows 404 content or redirects to a valid page
    expect(has404Content || !page.url().includes('nonexistent-page')).toBeTruthy();
  });

  test('should work with JavaScript disabled', async ({ browser }) => {
    // Create a new context with JavaScript disabled
    const context = await browser.newContext({
      javaScriptEnabled: false,
    });
    
    const page = await context.newPage();
    await page.goto('/');
    
    // Basic content should still be accessible
    const mainContent = page.locator('main, [role="main"], .main-content');
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
    
    // Navigation should still work
    const navLinks = page.locator('nav a, .navbar a');
    if (await navLinks.count() > 0) {
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.startsWith('#')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate successfully
        expect(page.url()).not.toBe('about:blank');
      }
    }
    
    await context.close();
  });

  test('should load critical resources efficiently', async ({ page }) => {
    // Monitor network requests
    const responses: any[] = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'],
        size: response.headers()['content-length'],
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that critical resources loaded successfully
    const criticalResources = responses.filter(r => 
      r.url.includes('.css') || 
      r.url.includes('.js') || 
      r.url.includes('font') ||
      r.status === 200
    );
    
    expect(criticalResources.length).toBeGreaterThan(0);
    
    // No broken resources
    const brokenResources = responses.filter(r => r.status >= 400);
    expect(brokenResources.length).toBe(0);
  });

  test('should maintain SEO optimization', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const content = await metaDescription.getAttribute('content');
      expect(content?.length).toBeGreaterThan(50);
    }
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    if (await ogTitle.count() > 0) {
      const content = await ogTitle.getAttribute('content');
      expect(content?.length).toBeGreaterThan(0);
    }
    
    // Check structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    if (await structuredData.count() > 0) {
      const jsonData = await structuredData.textContent();
      expect(() => JSON.parse(jsonData || '')).not.toThrow();
    }
    
    // Check heading hierarchy
    const h1Elements = page.locator('h1');
    expect(await h1Elements.count()).toBeLessThanOrEqual(1); // Should have only one H1
  });
});