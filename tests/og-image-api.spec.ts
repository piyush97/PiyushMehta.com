import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

// Test data constants
const TEST_TEMPLATES = ['default', 'minimal', 'tech', 'blog'] as const;
const TEST_THEMES = ['dark', 'light', 'retro'] as const;
const TEST_TYPES = ['website', 'article'] as const;

interface OGImageParams {
  title?: string;
  description?: string;
  type?: string;
  template?: string;
  theme?: string;
  date?: string;
  tags?: string;
}

// Helper function to generate OG image URL
function generateOGImageURL(params: OGImageParams = {}): string {
  const searchParams = new URLSearchParams();
  
  // Set defaults
  const defaults = {
    title: 'Test Title',
    description: 'Test Description',
    type: 'article',
    template: 'default',
    theme: 'dark',
    ...params
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  return `${BASE_URL}/api/og-image?${searchParams.toString()}`;
}

// Helper function to test image response
async function testImageResponse(url: string) {
  const response = await fetch(url);
  return {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type'),
    contentLength: parseInt(response.headers.get('content-length') || '0'),
    cacheControl: response.headers.get('cache-control'),
    body: response.ok ? await response.arrayBuffer() : null
  };
}

test.describe('OG Image API', () => {
  
  test.describe('Basic Functionality', () => {
    
    test('should generate image with default parameters', async () => {
      const url = generateOGImageURL();
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
      expect(result.contentLength).toBeGreaterThan(1000);
      expect(result.cacheControl).toContain('max-age=31536000');
    });

    test('should handle missing title parameter', async () => {
      const url = generateOGImageURL({ title: undefined });
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle missing description parameter', async () => {
      const url = generateOGImageURL({ description: undefined });
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Template Testing', () => {
    
    for (const template of TEST_TEMPLATES) {
      test(`should generate image with ${template} template`, async () => {
        const url = generateOGImageURL({
          title: `Test ${template} Template`,
          description: `Testing ${template} template generation`,
          template
        });
        
        const result = await testImageResponse(url);
        
        expect(result.status).toBe(200);
        expect(result.contentType).toBe('image/png');
        expect(result.contentLength).toBeGreaterThan(1000);
      });
    }

    test('should fallback to default template for invalid template', async () => {
      const url = generateOGImageURL({
        template: 'invalid-template'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Theme Testing', () => {
    
    for (const theme of TEST_THEMES) {
      test(`should generate image with ${theme} theme`, async () => {
        const url = generateOGImageURL({
          title: `Test ${theme} Theme`,
          description: `Testing ${theme} theme generation`,
          theme
        });
        
        const result = await testImageResponse(url);
        
        expect(result.status).toBe(200);
        expect(result.contentType).toBe('image/png');
        expect(result.contentLength).toBeGreaterThan(1000);
      });
    }

    test('should fallback to dark theme for invalid theme', async () => {
      const url = generateOGImageURL({
        theme: 'invalid-theme'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Template/Theme Combinations', () => {
    
    for (const template of TEST_TEMPLATES) {
      for (const theme of TEST_THEMES) {
        test(`should generate image with ${template}/${theme} combination`, async () => {
          const url = generateOGImageURL({
            title: `${template} Template with ${theme} Theme`,
            description: `Testing ${template} template with ${theme} theme`,
            template,
            theme
          });
          
          const result = await testImageResponse(url);
          
          expect(result.status).toBe(200);
          expect(result.contentType).toBe('image/png');
          expect(result.contentLength).toBeGreaterThan(1000);
        });
      }
    }
  });

  test.describe('Content Type Testing', () => {
    
    for (const type of TEST_TYPES) {
      test(`should generate image for ${type} type`, async () => {
        const url = generateOGImageURL({
          title: `Test ${type} Type`,
          description: `Testing ${type} content type`,
          type
        });
        
        const result = await testImageResponse(url);
        
        expect(result.status).toBe(200);
        expect(result.contentType).toBe('image/png');
      });
    }
  });

  test.describe('Content Length Testing', () => {
    
    test('should handle short title', async () => {
      const url = generateOGImageURL({
        title: 'Short',
        description: 'Testing short title'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle long title', async () => {
      const url = generateOGImageURL({
        title: 'This is a very long title that should test how the OG image generation handles extremely long titles that might exceed normal length limits and need to be truncated or handled specially',
        description: 'Testing long title truncation'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle long description', async () => {
      const url = generateOGImageURL({
        title: 'Long Description Test',
        description: 'This is a very long description that should test how the OG image generation handles extremely long descriptions that might exceed normal length limits and need to be truncated or handled specially in the image generation process'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle empty strings', async () => {
      const url = generateOGImageURL({
        title: '',
        description: ''
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Special Characters and Encoding', () => {
    
    test('should handle special characters in title', async () => {
      const url = generateOGImageURL({
        title: 'Test with "quotes" & symbols!',
        description: 'Testing special characters'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle unicode characters', async () => {
      const url = generateOGImageURL({
        title: 'Test with émojis 🚀 and üñïcödé',
        description: 'Testing unicode and emoji characters'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle HTML entities', async () => {
      const url = generateOGImageURL({
        title: 'Test with &amp; &lt; &gt; entities',
        description: 'Testing HTML entity handling'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Date and Tags Testing', () => {
    
    test('should handle valid date parameter', async () => {
      const url = generateOGImageURL({
        title: 'Date Test',
        description: 'Testing date parameter',
        date: '2025-07-18',
        type: 'article'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle invalid date parameter', async () => {
      const url = generateOGImageURL({
        title: 'Invalid Date Test',
        description: 'Testing invalid date parameter',
        date: 'invalid-date',
        type: 'article'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle tags parameter', async () => {
      const url = generateOGImageURL({
        title: 'Tags Test',
        description: 'Testing tags parameter',
        tags: 'TypeScript,JavaScript,Programming,Web Development'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle empty tags parameter', async () => {
      const url = generateOGImageURL({
        title: 'Empty Tags Test',
        description: 'Testing empty tags parameter',
        tags: ''
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Performance and Caching', () => {
    
    test('should return proper cache headers', async () => {
      const url = generateOGImageURL();
      const result = await testImageResponse(url);
      
      expect(result.cacheControl).toContain('public');
      expect(result.cacheControl).toContain('max-age=31536000');
      expect(result.cacheControl).toContain('immutable');
    });

    test('should generate different images for different parameters', async () => {
      const url1 = generateOGImageURL({
        title: 'First Title',
        template: 'tech'
      });
      
      const url2 = generateOGImageURL({
        title: 'Second Title',
        template: 'blog'
      });
      
      const [result1, result2] = await Promise.all([
        testImageResponse(url1),
        testImageResponse(url2)
      ]);
      
      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
      expect(result1.contentLength).not.toBe(result2.contentLength);
    });

    test('should handle concurrent requests', async () => {
      const urls = Array(5).fill(0).map((_, i) => 
        generateOGImageURL({
          title: `Concurrent Test ${i}`,
          description: `Testing concurrent request ${i}`
        })
      );
      
      const results = await Promise.all(urls.map(testImageResponse));
      
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.contentType).toBe('image/png');
      });
    });
  });

  test.describe('Real-world Blog Article Tests', () => {
    
    test('should generate TypeScript article OG image', async () => {
      const url = generateOGImageURL({
        title: 'TypeScript 5.9 Beta: Revolutionary Features That Will Transform How You Code',
        description: 'Discover the game-changing features in TypeScript 5.9 beta including deferred module evaluation, Node.js 20 support, and performance optimizations',
        type: 'article',
        template: 'tech',
        theme: 'dark',
        date: '2025-07-18',
        tags: 'TypeScript,JavaScript,Performance,Node.js'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
      expect(result.contentLength).toBeGreaterThan(1000);
    });

    test('should generate blog template article', async () => {
      const url = generateOGImageURL({
        title: 'How Do I Stop Feeling Inferior?',
        description: 'How to stop feeling inferior or inferiority complex',
        type: 'article',
        template: 'blog',
        theme: 'dark',
        date: '2020-07-11',
        tags: 'self help,personality,career,motivation'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should generate minimal template article', async () => {
      const url = generateOGImageURL({
        title: 'Migrating Legacy Codebase to Astro',
        description: 'A comprehensive guide to migrating from legacy frameworks to Astro',
        type: 'article',
        template: 'minimal',
        theme: 'light',
        date: '2025-01-15'
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle malformed URL parameters gracefully', async () => {
      const url = `${BASE_URL}/api/og-image?title=%&description=%&template=invalid`;
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });

    test('should handle extremely long URL', async () => {
      const longString = 'a'.repeat(2000);
      const url = generateOGImageURL({
        title: longString,
        description: longString
      });
      
      const result = await testImageResponse(url);
      
      expect(result.status).toBe(200);
      expect(result.contentType).toBe('image/png');
    });
  });

  test.describe('Image Quality and Size', () => {
    
    test('should generate images within reasonable size limits', async () => {
      for (const template of TEST_TEMPLATES) {
        const url = generateOGImageURL({
          title: 'Size Test',
          description: 'Testing image size',
          template
        });
        
        const result = await testImageResponse(url);
        
        expect(result.status).toBe(200);
        // Images should be between 10KB and 500KB
        expect(result.contentLength).toBeGreaterThan(10000);
        expect(result.contentLength).toBeLessThan(500000);
      }
    });

    test('should generate consistent image dimensions', async () => {
      // All OG images should be 1200x630 pixels
      // This test verifies the Content-Length header is consistent for similar content
      const baseParams = {
        title: 'Dimension Test',
        description: 'Testing image dimensions',
        template: 'default' as const,
        theme: 'dark' as const
      };
      
      const url1 = generateOGImageURL(baseParams);
      const url2 = generateOGImageURL(baseParams);
      
      const [result1, result2] = await Promise.all([
        testImageResponse(url1),
        testImageResponse(url2)
      ]);
      
      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
      expect(result1.contentLength).toBe(result2.contentLength);
    });
  });

  test.describe('Response Headers', () => {
    
    test('should return correct MIME type', async () => {
      const url = generateOGImageURL();
      const result = await testImageResponse(url);
      
      expect(result.contentType).toBe('image/png');
    });

    test('should include CDN cache headers', async () => {
      const url = generateOGImageURL();
      const response = await fetch(url);
      
      expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=31536000');
      expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('max-age=31536000');
    });

    test('should include content length header', async () => {
      const url = generateOGImageURL();
      const response = await fetch(url);
      
      const contentLength = response.headers.get('Content-Length');
      expect(contentLength).toBeTruthy();
      expect(parseInt(contentLength!)).toBeGreaterThan(0);
    });
  });
});

test.describe('OG Image API Load Testing', () => {
  
  test('should handle multiple rapid requests', async () => {
    const requests = Array(10).fill(0).map((_, i) => 
      fetch(generateOGImageURL({
        title: `Load Test ${i}`,
        description: `Load testing request ${i}`
      }))
    );
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  test('should maintain performance under load', async () => {
    const startTime = Date.now();
    
    const requests = Array(5).fill(0).map((_, i) => 
      fetch(generateOGImageURL({
        title: `Performance Test ${i}`,
        template: 'tech'
      }))
    );
    
    await Promise.all(requests);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All 5 requests should complete within 10 seconds
    expect(totalTime).toBeLessThan(10000);
  });
});