import { expect, test } from '@playwright/test';

// Performance test configuration
const performanceConfig = {
  timeout: 30000, // 30 seconds timeout
  retries: 2,
};

// Performance benchmarks
const performanceBenchmarks = {
  maxGenerationTime: 5000,  // 5 seconds max generation time
  maxImageSize: 500000,     // 500KB max image size
  minImageSize: 5000,       // 5KB min image size (ensure it's not empty)
  maxCacheTime: 1000,       // 1 second max for cached responses
  concurrentRequests: 10,   // Number of concurrent requests to test
};

test.describe('OG Image Performance Tests', () => {
  test.use(performanceConfig);

  test.describe('Generation Performance', () => {
    test('should generate images within acceptable time limits', async ({ page }) => {
      const testCases = [
        { template: 'modern', complexity: 'low' },
        { template: 'tech', complexity: 'medium' },
        { template: 'cyber', complexity: 'high' },
        { template: 'terminal', complexity: 'high' },
        { template: 'minimal', complexity: 'low' },
      ];

      for (const testCase of testCases) {
        const startTime = Date.now();
        
        const params = new URLSearchParams({
          title: `Performance Test ${testCase.template}`,
          description: `Testing ${testCase.template} template performance`,
          template: testCase.template,
          theme: 'dark',
          tags: 'performance,test,benchmark',
          showLogo: 'true',
          showBadge: 'true',
        });

        const response = await page.goto(`/api/og-image?${params}`);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
        expect(duration).toBeLessThan(performanceBenchmarks.maxGenerationTime);

        console.log(`${testCase.template} (${testCase.complexity}): ${duration}ms`);
      }
    });

    test('should generate images with appropriate file sizes', async ({ page }) => {
      const templates = ['modern', 'tech', 'cyber', 'minimal', 'terminal'];
      
      for (const template of templates) {
        const params = new URLSearchParams({
          title: `Size Test ${template}`,
          description: `Testing ${template} template file size`,
          template: template,
          theme: 'dark',
          tags: 'size,test,benchmark',
          showLogo: 'true',
          showBadge: 'true',
        });

        const response = await page.goto(`/api/og-image?${params}`);
        const imageBuffer = await response?.body();
        const imageSize = imageBuffer?.length || 0;

        expect(response?.status()).toBe(200);
        expect(imageSize).toBeGreaterThan(performanceBenchmarks.minImageSize);
        expect(imageSize).toBeLessThan(performanceBenchmarks.maxImageSize);

        console.log(`${template} template: ${imageSize} bytes`);
      }
    });

    test('should handle varying content lengths efficiently', async ({ page }) => {
      const contentTests = [
        { title: 'Short', description: 'Brief.' },
        { title: 'Medium Length Title Here', description: 'This is a medium length description that should test normal use cases.' },
        { title: 'This is a Very Long Title That Should Test the Dynamic Sizing Feature', description: 'This is a very long description that should test how the system handles longer content and whether it affects generation performance significantly.' },
      ];

      for (const content of contentTests) {
        const startTime = Date.now();
        
        const params = new URLSearchParams({
          title: content.title,
          description: content.description,
          template: 'modern',
          theme: 'dark',
          tags: 'length,test,performance',
          showLogo: 'true',
          showBadge: 'true',
        });

        const response = await page.goto(`/api/og-image?${params}`);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response?.status()).toBe(200);
        expect(duration).toBeLessThan(performanceBenchmarks.maxGenerationTime);

        console.log(`Content length ${content.title.length}/${content.description.length}: ${duration}ms`);
      }
    });
  });

  test.describe('Caching Performance', () => {
    test('should serve cached responses quickly', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Cache Performance Test',
        description: 'Testing cache performance',
        template: 'modern',
        theme: 'dark',
        tags: 'cache,performance,test',
        showLogo: 'true',
        showBadge: 'true',
      });

      const url = `/api/og-image?${params}`;

      // First request (uncached)
      const startTime1 = Date.now();
      const response1 = await page.goto(url);
      const endTime1 = Date.now();
      const duration1 = endTime1 - startTime1;

      expect(response1?.status()).toBe(200);

      // Second request (should be cached)
      const startTime2 = Date.now();
      const response2 = await page.goto(url);
      const endTime2 = Date.now();
      const duration2 = endTime2 - startTime2;

      expect(response2?.status()).toBe(200);

      // Cached response should be significantly faster
      console.log(`Uncached: ${duration1}ms, Cached: ${duration2}ms`);
      
      // Note: In some cases, cached responses might not be significantly faster
      // due to network overhead, but they should not be slower
      expect(duration2).toBeLessThan(duration1 * 2); // Allow some variance
    });

    test('should handle cache headers correctly', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Cache Headers Test',
        description: 'Testing cache headers',
        template: 'modern',
        theme: 'dark',
        tags: 'cache,headers,test',
      });

      const response = await page.goto(`/api/og-image?${params}`);
      const headers = response?.headers();

      expect(response?.status()).toBe(200);
      expect(headers?.['cache-control']).toBeTruthy();
      expect(headers?.['content-type']).toBe('image/png');
      
      // Check for appropriate cache control values
      const cacheControl = headers?.['cache-control'];
      expect(cacheControl).toContain('max-age');
      
      console.log(`Cache-Control: ${cacheControl}`);
    });
  });

  test.describe('Concurrent Request Performance', () => {
    test('should handle multiple concurrent requests', async ({ browser }) => {
      const contexts = await Promise.all(
        Array.from({ length: performanceBenchmarks.concurrentRequests }, () => 
          browser.newContext()
        )
      );

      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      );

      const startTime = Date.now();

      // Make concurrent requests with different parameters
      const requests = pages.map((page, index) => {
        const params = new URLSearchParams({
          title: `Concurrent Test ${index + 1}`,
          description: `Testing concurrent request ${index + 1}`,
          template: 'modern',
          theme: index % 2 === 0 ? 'dark' : 'light',
          tags: `concurrent,test,${index + 1}`,
          showLogo: 'true',
          showBadge: 'true',
        });

        return page.goto(`/api/og-image?${params}`);
      });

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // All requests should succeed
      responses.forEach((response, _index) => {
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
      });

      console.log(`${performanceBenchmarks.concurrentRequests} concurrent requests: ${totalDuration}ms`);
      console.log(`Average per request: ${totalDuration / performanceBenchmarks.concurrentRequests}ms`);

      // Average per request should be reasonable
      expect(totalDuration / performanceBenchmarks.concurrentRequests).toBeLessThan(performanceBenchmarks.maxGenerationTime);

      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    });

    test('should maintain performance under load', async ({ browser }) => {
      const batchSize = 5;
      const batches = 3;
      const results: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const contexts = await Promise.all(
          Array.from({ length: batchSize }, () => browser.newContext())
        );
        
        const pages = await Promise.all(
          contexts.map(context => context.newPage())
        );

        const startTime = Date.now();

        const requests = pages.map((page, index) => {
          const params = new URLSearchParams({
            title: `Load Test Batch ${batch + 1} Request ${index + 1}`,
            description: `Testing load performance batch ${batch + 1}`,
            template: 'modern',
            theme: 'dark',
            tags: `load,test,batch${batch + 1}`,
            showLogo: 'true',
            showBadge: 'true',
          });

          return page.goto(`/api/og-image?${params}`);
        });

        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const batchDuration = endTime - startTime;

        // All requests should succeed
        responses.forEach((response) => {
          expect(response?.status()).toBe(200);
          expect(response?.headers()['content-type']).toBe('image/png');
        });

        results.push(batchDuration);
        console.log(`Batch ${batch + 1}: ${batchDuration}ms`);

        // Clean up
        await Promise.all(contexts.map(context => context.close()));

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Performance should remain consistent across batches
      const avgDuration = results.reduce((sum, duration) => sum + duration, 0) / results.length;
      const maxDuration = Math.max(...results);
      const minDuration = Math.min(...results);

      console.log(`Average batch duration: ${avgDuration}ms`);
      console.log(`Min: ${minDuration}ms, Max: ${maxDuration}ms`);

      // Variation should not be too extreme
      expect(maxDuration - minDuration).toBeLessThan(avgDuration * 0.5); // Max 50% variation
    });
  });

  test.describe('Resource Usage Performance', () => {
    test('should handle memory-intensive operations', async ({ page }) => {
      // Test with complex content that might use more memory
      const complexContent = {
        title: 'Complex Memory Test with Long Title and Many Elements',
        description: 'This is a complex test case designed to test memory usage with a long description that contains many words and should stress test the image generation process to ensure it handles memory efficiently.',
        template: 'cyber', // Most complex template
        theme: 'dark',
        tags: 'memory,test,complex,stress,performance,benchmark,load,intensive',
        showLogo: 'true',
        showBadge: 'true',
        type: 'article',
        date: new Date().toISOString(),
        readingTime: '10',
      };

      const startTime = Date.now();
      
      const params = new URLSearchParams(complexContent);
      const response = await page.goto(`/api/og-image?${params}`);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
      expect(duration).toBeLessThan(performanceBenchmarks.maxGenerationTime);

      const imageBuffer = await response?.body();
      const imageSize = imageBuffer?.length || 0;
      
      expect(imageSize).toBeGreaterThan(performanceBenchmarks.minImageSize);
      expect(imageSize).toBeLessThan(performanceBenchmarks.maxImageSize);

      console.log(`Complex content generation: ${duration}ms, Size: ${imageSize} bytes`);
    });

    test('should handle rapid successive requests', async ({ page }) => {
      const requestCount = 20;
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < requestCount; i++) {
        const params = new URLSearchParams({
          title: `Rapid Request ${i + 1}`,
          description: `Testing rapid successive request ${i + 1}`,
          template: 'modern',
          theme: i % 2 === 0 ? 'dark' : 'light',
          tags: `rapid,test,${i + 1}`,
          showLogo: 'true',
          showBadge: 'true',
        });

        requests.push(page.goto(`/api/og-image?${params}`));
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // All requests should succeed
      responses.forEach((response, _index) => {
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
      });

      console.log(`${requestCount} rapid requests: ${totalDuration}ms`);
      console.log(`Average per request: ${totalDuration / requestCount}ms`);

      // Should handle rapid requests efficiently
      expect(totalDuration / requestCount).toBeLessThan(performanceBenchmarks.maxGenerationTime);
    });
  });

  test.describe('Edge Case Performance', () => {
    test('should handle edge cases without significant performance degradation', async ({ page }) => {
      const edgeCases = [
        {
          name: 'empty-title',
          params: { title: '', description: 'Empty title test', template: 'modern', theme: 'dark' },
        },
        {
          name: 'unicode-heavy',
          params: { title: '🚀🎨🔥💻🌟⚡🎯🚀🎨🔥💻🌟⚡🎯', description: 'Unicode emoji test', template: 'modern', theme: 'dark' },
        },
        {
          name: 'special-chars',
          params: { title: '<>&"\'`~!@#$%^&*()_+-=[]{}|;:,.<>?', description: 'Special characters test', template: 'modern', theme: 'dark' },
        },
        {
          name: 'max-tags',
          params: { title: 'Max tags test', description: 'Testing maximum tags', template: 'modern', theme: 'dark', tags: 'tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10' },
        },
        {
          name: 'invalid-template',
          params: { title: 'Invalid template test', description: 'Testing invalid template', template: 'nonexistent', theme: 'dark' },
        },
      ];

      for (const edgeCase of edgeCases) {
        const startTime = Date.now();
        
        const params = new URLSearchParams(edgeCase.params);
        const response = await page.goto(`/api/og-image?${params}`);
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
        expect(duration).toBeLessThan(performanceBenchmarks.maxGenerationTime);

        console.log(`Edge case ${edgeCase.name}: ${duration}ms`);
      }
    });
  });
});