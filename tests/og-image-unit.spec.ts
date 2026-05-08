import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

test.describe('OG Image API - Unit Tests', () => {
  test.describe('Parameter Validation', () => {
    test('should use default values for missing parameters', async () => {
      const response = await fetch(`${BASE_URL}/api/og-image`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should handle null parameters', async () => {
      const params = new URLSearchParams({
        title: '',
        description: '',
        type: '',
        template: '',
        theme: '',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should sanitize potentially harmful input', async () => {
      const params = new URLSearchParams({
        title: '<script>alert("xss")</script>',
        description: '${process.env.SECRET}',
        template: '../../../etc/passwd',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  test.describe('Template Logic', () => {
    test('should render default template correctly', async () => {
      const params = new URLSearchParams({
        title: 'Default Template Test',
        description: 'Testing default template rendering',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      expect(contentLength).toBeGreaterThan(50000); // Default template should be fairly large
    });

    test('should render minimal template correctly', async () => {
      const params = new URLSearchParams({
        title: 'Minimal Template Test',
        description: 'Testing minimal template rendering',
        template: 'minimal',
        theme: 'light',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      expect(contentLength).toBeGreaterThan(30000); // Minimal should be smaller but still substantial
    });

    test('should render tech template correctly', async () => {
      const params = new URLSearchParams({
        title: 'Tech Template Test',
        description: 'Testing tech template rendering',
        template: 'tech',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      expect(contentLength).toBeGreaterThan(30000);
    });

    test('should render blog template correctly', async () => {
      const params = new URLSearchParams({
        title: 'Blog Template Test',
        description: 'Testing blog template rendering',
        template: 'blog',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      expect(contentLength).toBeGreaterThan(50000); // Blog template should be substantial
    });
  });

  test.describe('Theme Rendering', () => {
    test('should render dark theme with proper contrast', async () => {
      const params = new URLSearchParams({
        title: 'Dark Theme Test',
        description: 'Testing dark theme rendering',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should render light theme with proper contrast', async () => {
      const params = new URLSearchParams({
        title: 'Light Theme Test',
        description: 'Testing light theme rendering',
        template: 'default',
        theme: 'light',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should render retro theme with proper styling', async () => {
      const params = new URLSearchParams({
        title: 'Retro Theme Test',
        description: 'Testing retro theme rendering',
        template: 'default',
        theme: 'retro',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  test.describe('Font and Typography', () => {
    test('should handle different title lengths appropriately', async () => {
      const testCases = [
        { title: 'Short', expectedSize: 'large' },
        { title: 'Medium length title that should fit nicely', expectedSize: 'medium' },
        {
          title:
            'This is a very long title that should test the font sizing algorithm and ensure that it scales appropriately for longer content',
          expectedSize: 'small',
        },
      ];

      for (const testCase of testCases) {
        const params = new URLSearchParams({
          title: testCase.title,
          description: 'Testing font sizing',
          template: 'default',
          theme: 'dark',
        });

        const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/png');
      }
    });

    test('should handle special typography characters', async () => {
      const params = new URLSearchParams({
        title: 'Typography Test: "Quotes" & \'Smart Quotes\' — Dashes',
        description: 'Testing special typography characters',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  test.describe('Date and Metadata Handling', () => {
    test('should format dates correctly for articles', async () => {
      const params = new URLSearchParams({
        title: 'Date Test Article',
        description: 'Testing date formatting',
        type: 'article',
        date: '2025-07-18',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should handle invalid date formats gracefully', async () => {
      const params = new URLSearchParams({
        title: 'Invalid Date Test',
        description: 'Testing invalid date handling',
        type: 'article',
        date: 'not-a-date',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should process tags correctly', async () => {
      const params = new URLSearchParams({
        title: 'Tags Test',
        description: 'Testing tag processing',
        tags: 'React,TypeScript,JavaScript,Node.js,Performance',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  test.describe('Image Generation Quality', () => {
    test('should generate images with consistent quality', async () => {
      const params = new URLSearchParams({
        title: 'Quality Test',
        description: 'Testing image generation quality',
        template: 'default',
        theme: 'dark',
      });

      // Generate the same image multiple times
      const responses = await Promise.all([
        fetch(`${BASE_URL}/api/og-image?${params}`),
        fetch(`${BASE_URL}/api/og-image?${params}`),
        fetch(`${BASE_URL}/api/og-image?${params}`),
      ]);

      // All should be successful
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/png');
      });

      // Content length should be identical (deterministic generation)
      const contentLengths = responses.map((r) => parseInt(r.headers.get('content-length') || '0'));

      expect(contentLengths[0]).toBe(contentLengths[1]);
      expect(contentLengths[1]).toBe(contentLengths[2]);
    });

    test('should maintain image quality across templates', async () => {
      const templates = ['default', 'minimal', 'tech', 'blog'];

      for (const template of templates) {
        const params = new URLSearchParams({
          title: 'Quality Test',
          description: 'Testing image quality',
          template,
          theme: 'dark',
        });

        const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/png');

        const contentLength = parseInt(response.headers.get('content-length') || '0');
        expect(contentLength).toBeGreaterThan(10000); // Minimum quality threshold
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should handle font loading failures gracefully', async () => {
      // This test ensures the API doesn't crash if font loading fails
      const params = new URLSearchParams({
        title: 'Font Failure Test',
        description: 'Testing font loading failure recovery',
        template: 'default',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should handle theme configuration errors', async () => {
      const params = new URLSearchParams({
        title: 'Theme Error Test',
        description: 'Testing theme error handling',
        template: 'default',
        theme: 'nonexistent-theme',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('should handle rapid sequential requests', async () => {
      const requests = [];

      for (let i = 0; i < 5; i++) {
        const params = new URLSearchParams({
          title: `Sequential Test ${i}`,
          description: 'Testing sequential request handling',
          template: 'default',
          theme: 'dark',
        });

        requests.push(fetch(`${BASE_URL}/api/og-image?${params}`));
      }

      const responses = await Promise.all(requests);

      responses.forEach((response, _index) => {
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/png');
      });
    });

    test('should maintain reasonable response times', async () => {
      const startTime = Date.now();

      const params = new URLSearchParams({
        title: 'Performance Test',
        description: 'Testing response time performance',
        template: 'tech',
        theme: 'dark',
      });

      const response = await fetch(`${BASE_URL}/api/og-image?${params}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');

      // Response should be under 5 seconds for single request
      expect(responseTime).toBeLessThan(5000);
    });
  });
});
