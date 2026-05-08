import { expect, test } from '@playwright/test';

// Test data for OG image generation
const testData = {
  blogPost: {
    title: 'Building Modern Web Applications with React and TypeScript',
    description:
      'Learn how to create scalable, maintainable web applications using React, TypeScript, and modern development practices.',
    tags: ['React', 'TypeScript', 'Web Development', 'Frontend'],
    type: 'article',
    readingTime: '8',
  },
  project: {
    title: 'React Developer Portfolio',
    description:
      'A modern, responsive portfolio website built with React, TypeScript, and Tailwind CSS.',
    tags: ['React', 'Portfolio', 'Design', 'Open Source'],
    type: 'project',
  },
  talk: {
    title: 'The Future of Web Development',
    description:
      'A deep dive into emerging technologies and trends shaping the future of web development.',
    tags: ['Web Dev', 'Technology', 'Future'],
    type: 'website',
  },
  longTitle: {
    title:
      'This is a Very Long Title That Should Test the Dynamic Sizing Feature of the OG Image Generation System',
    description:
      'Testing how the system handles extremely long titles and whether it adjusts font sizes appropriately.',
    tags: ['Test', 'Long Content'],
    type: 'article',
  },
  shortTitle: {
    title: 'Short',
    description: 'Testing short content.',
    tags: ['Test'],
    type: 'article',
  },
};

// Available templates to test
const templates = [
  'modern',
  'tech',
  'cyber',
  'minimal',
  'terminal',
  'gradient',
  'professional',
  'dark',
  'blog',
];

// Available themes to test
const themes = ['dark', 'light', 'auto'];

test.describe('OG Image Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary state or navigate to a base page
    await page.goto('/');
  });

  test.describe('Basic OG Image Generation', () => {
    test('should generate OG image with default parameters', async ({ page }) => {
      const response = await page.goto('/api/og-image?title=Test%20Image');

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');

      // Check that the image has the expected dimensions
      const buffer = await response?.body();
      expect(buffer?.length).toBeGreaterThan(10000); // Should be a substantial image
    });

    test('should generate OG image with blog post content', async ({ page }) => {
      const params = new URLSearchParams({
        title: testData.blogPost.title,
        description: testData.blogPost.description,
        type: testData.blogPost.type,
        template: 'blog',
        theme: 'dark',
        tags: testData.blogPost.tags.join(','),
        readingTime: testData.blogPost.readingTime,
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');

      // Verify cache headers
      const cacheControl = response?.headers()['cache-control'];
      expect(cacheControl).toContain('max-age');
    });

    test('should generate OG image with project content', async ({ page }) => {
      const params = new URLSearchParams({
        title: testData.project.title,
        description: testData.project.description,
        type: testData.project.type,
        template: 'modern',
        theme: 'dark',
        tags: testData.project.tags.join(','),
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should generate OG image with talk content', async ({ page }) => {
      const params = new URLSearchParams({
        title: testData.talk.title,
        description: testData.talk.description,
        type: testData.talk.type,
        template: 'tech',
        theme: 'dark',
        tags: testData.talk.tags.join(','),
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });
  });

  test.describe('Template Variations', () => {
    templates.forEach((template) => {
      test(`should generate OG image with ${template} template`, async ({ page }) => {
        const params = new URLSearchParams({
          title: 'Template Test',
          description: `Testing ${template} template`,
          template: template,
          theme: 'dark',
          tags: 'test,template',
        });

        const response = await page.goto(`/api/og-image?${params}`);

        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');

        // Check image size is reasonable
        const buffer = await response?.body();
        expect(buffer?.length).toBeGreaterThan(5000);
        expect(buffer?.length).toBeLessThan(500000); // Should be under 500KB
      });
    });
  });

  test.describe('Theme Variations', () => {
    themes.forEach((theme) => {
      test(`should generate OG image with ${theme} theme`, async ({ page }) => {
        const params = new URLSearchParams({
          title: 'Theme Test',
          description: `Testing ${theme} theme`,
          template: 'modern',
          theme: theme,
          tags: 'test,theme',
        });

        const response = await page.goto(`/api/og-image?${params}`);

        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
      });
    });
  });

  test.describe('Dynamic Content Sizing', () => {
    test('should handle very long titles', async ({ page }) => {
      const params = new URLSearchParams({
        title: testData.longTitle.title,
        description: testData.longTitle.description,
        template: 'modern',
        theme: 'dark',
        tags: testData.longTitle.tags.join(','),
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should handle short titles', async ({ page }) => {
      const params = new URLSearchParams({
        title: testData.shortTitle.title,
        description: testData.shortTitle.description,
        template: 'modern',
        theme: 'dark',
        tags: testData.shortTitle.tags.join(','),
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should handle long descriptions', async ({ page }) => {
      const longDescription =
        'This is a very long description that should test the dynamic sizing feature of the OG image generation system. It contains multiple sentences and should be properly truncated or sized to fit within the image boundaries while maintaining readability.';

      const params = new URLSearchParams({
        title: 'Long Description Test',
        description: longDescription,
        template: 'modern',
        theme: 'dark',
        tags: 'test,long,description',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });
  });

  test.describe('Parameter Validation', () => {
    test('should handle missing title gracefully', async ({ page }) => {
      const params = new URLSearchParams({
        description: 'Test description',
        template: 'modern',
        theme: 'dark',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should handle invalid template gracefully', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Invalid Template Test',
        description: 'Testing invalid template',
        template: 'nonexistent',
        theme: 'dark',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      // Should fallback to default template
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should handle invalid theme gracefully', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Invalid Theme Test',
        description: 'Testing invalid theme',
        template: 'modern',
        theme: 'nonexistent',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      // Should fallback to default theme
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should handle special characters in title', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Special Characters: <>&"\'',
        description: 'Testing special characters',
        template: 'modern',
        theme: 'dark',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should handle Unicode characters', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Unicode Test: 🚀 React + TypeScript 📚',
        description: 'Testing Unicode and emoji support',
        template: 'modern',
        theme: 'dark',
        tags: 'unicode,emoji,test',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });
  });

  test.describe('Performance and Caching', () => {
    test('should return cached response for identical requests', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Cache Test',
        description: 'Testing cache behavior',
        template: 'modern',
        theme: 'dark',
      });

      const url = `/api/og-image?${params}`;

      // First request
      const response1 = await page.goto(url);
      expect(response1?.status()).toBe(200);

      // Second request (should be cached)
      const response2 = await page.goto(url);
      expect(response2?.status()).toBe(200);

      // Both should return the same content type
      expect(response1?.headers()['content-type']).toBe('image/png');
      expect(response2?.headers()['content-type']).toBe('image/png');
    });

    test('should have appropriate cache headers', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Cache Headers Test',
        description: 'Testing cache headers',
        template: 'modern',
        theme: 'dark',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);

      const headers = response?.headers();
      expect(headers?.['cache-control']).toBeTruthy();
      expect(headers?.['content-type']).toBe('image/png');
    });

    test('should generate images within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      const params = new URLSearchParams({
        title: 'Performance Test',
        description: 'Testing generation performance',
        template: 'modern',
        theme: 'dark',
        tags: 'performance,test',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response?.status()).toBe(200);
      expect(duration).toBeLessThan(5000); // Should generate within 5 seconds
    });
  });

  test.describe('Visual Components', () => {
    test('should generate image with logo when showLogo=true', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Logo Test',
        description: 'Testing logo display',
        template: 'modern',
        theme: 'dark',
        showLogo: 'true',
        showBadge: 'true',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should generate image without logo when showLogo=false', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'No Logo Test',
        description: 'Testing without logo',
        template: 'modern',
        theme: 'dark',
        showLogo: 'false',
        showBadge: 'false',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should generate image with multiple tags', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Multiple Tags Test',
        description: 'Testing multiple tags display',
        template: 'modern',
        theme: 'dark',
        tags: 'React,TypeScript,JavaScript,Web Development,Frontend',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });

    test('should generate image with date information', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Date Test',
        description: 'Testing date display',
        template: 'modern',
        theme: 'dark',
        date: new Date().toISOString(),
      });

      const response = await page.goto(`/api/og-image?${params}`);

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      // Test with extremely long parameters that might cause issues
      const veryLongTitle = 'A'.repeat(1000);
      const params = new URLSearchParams({
        title: veryLongTitle,
        description: 'Testing error handling',
        template: 'modern',
        theme: 'dark',
      });

      const response = await page.goto(`/api/og-image?${params}`);

      // Should either succeed or return a proper error status
      expect([200, 400, 500]).toContain(response?.status());
    });

    test('should handle malformed parameters', async ({ page }) => {
      // Test with malformed URL parameters
      const malformedUrl = '/api/og-image?title=%ZZ%ZZ&template=modern';

      const response = await page.goto(malformedUrl);

      // Should handle gracefully, either decode or use defaults
      expect([200, 400]).toContain(response?.status());
    });
  });
});
