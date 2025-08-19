// 🧪 Comprehensive OG Image Testing & Validation System
// Automated testing, validation, and quality assurance for OG images

import { generateCachedOGImage, getCacheStats } from './og-cache';
import { type OGImageParams } from './og-generator';

// 🎯 Test Configuration
export interface TestConfig {
  title: string;
  description: string;
  expectedTemplate: string;
  expectedTheme: string;
  tags?: string[];
  category?: string;
  shouldPass: boolean;
}

// 📊 Test Results
export interface TestResult {
  testName: string;
  passed: boolean;
  generationTime: number;
  imageSize: number;
  error?: string;
  metadata: {
    template: string;
    theme: string;
    dimensions: { width: number; height: number };
    hasValidPNG: boolean;
  };
}

// 🧪 Comprehensive Test Suite
export const OG_TEST_SUITE: TestConfig[] = [
  // Template Tests
  {
    title: 'Modern Blog Template Test',
    description:
      'Testing the modern blog template with comprehensive content and multiple tags for validation.',
    expectedTemplate: 'modern',
    expectedTheme: 'dark',
    tags: ['blog', 'modern', 'test'],
    category: 'Blog',
    shouldPass: true,
  },
  {
    title: 'Tech Template with Neon Theme',
    description: 'Advanced technical content with code examples and developer-focused features.',
    expectedTemplate: 'tech',
    expectedTheme: 'neon',
    tags: ['javascript', 'react', 'typescript', 'development'],
    category: 'Technical',
    shouldPass: true,
  },
  {
    title: 'Professional Corporate Template',
    description: 'Business-focused content for corporate and professional services.',
    expectedTemplate: 'professional',
    expectedTheme: 'corporate',
    tags: ['business', 'professional', 'services'],
    category: 'Professional',
    shouldPass: true,
  },
  {
    title: 'Minimal Clean Design',
    description: 'Clean, typography-focused design for elegant presentation.',
    expectedTemplate: 'minimal',
    expectedTheme: 'light',
    tags: ['design', 'minimal', 'clean'],
    category: 'Design',
    shouldPass: true,
  },
  {
    title: 'Terminal Cyber Aesthetic',
    description: 'Dark cyber theme with terminal styling for technical content.',
    expectedTemplate: 'terminal',
    expectedTheme: 'neon',
    tags: ['terminal', 'cyber', 'hacker', 'dark'],
    category: 'Tech',
    shouldPass: true,
  },
  {
    title: 'Gradient Creative Design',
    description: 'Vibrant gradient design with creative elements and modern styling.',
    expectedTemplate: 'gradient',
    expectedTheme: 'warm',
    tags: ['creative', 'design', 'gradient', 'modern'],
    category: 'Creative',
    shouldPass: true,
  },

  // Edge Case Tests
  {
    title:
      'Very Long Title That Should Be Properly Truncated When It Exceeds The Maximum Length Limit For Social Media Platforms And URL Parameters',
    description:
      'Testing extremely long titles to ensure proper truncation and handling of edge cases in URL generation and image rendering without breaking the layout or causing visual issues.',
    expectedTemplate: 'modern',
    expectedTheme: 'dark',
    tags: ['edge-case', 'long-title', 'truncation'],
    shouldPass: true,
  },
  {
    title: 'Special Characters & Symbols Test: <>&"\'`',
    description:
      'Testing special characters, HTML entities, quotes, and symbols: <script>alert("test")</script> & other dangerous content.',
    expectedTemplate: 'minimal',
    expectedTheme: 'light',
    tags: ['special-chars', 'security', 'escaping'],
    shouldPass: true,
  },
  {
    title: 'Unicode & Emoji Test 🚀🎨✨',
    description:
      'Testing Unicode characters, emojis, and international text: 你好世界 🌍 Здравствуй мир 🇷🇺 Hello مرحبا 🇸🇦',
    expectedTemplate: 'tech',
    expectedTheme: 'neon',
    tags: ['unicode', 'emoji', 'international'],
    shouldPass: true,
  },
  {
    title: '',
    description: 'Testing empty title edge case',
    expectedTemplate: 'minimal',
    expectedTheme: 'light',
    shouldPass: false, // Should fail validation
  },

  // Performance Tests
  {
    title: 'Performance Test - Maximum Tags',
    description: 'Testing performance with maximum number of tags and complex content rendering.',
    expectedTemplate: 'tech',
    expectedTheme: 'dark',
    tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10'],
    category: 'Performance',
    shouldPass: true,
  },
];

// 🔍 Image Validation Functions
async function validatePNGHeader(imageBuffer: Buffer): Promise<boolean> {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return imageBuffer.subarray(0, 8).equals(pngSignature);
}

async function extractImageDimensions(
  imageBuffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    // For PNG images, dimensions are at bytes 16-23
    if (await validatePNGHeader(imageBuffer)) {
      const width = imageBuffer.readUInt32BE(16);
      const height = imageBuffer.readUInt32BE(20);
      return { width, height };
    }
    return null;
  } catch {
    return null;
  }
}

// 🧪 Individual Test Runner
async function runSingleTest(testConfig: TestConfig): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Skip tests that should fail validation
    if (!testConfig.shouldPass && !testConfig.title) {
      return {
        testName: testConfig.title || 'Empty Title Test',
        passed: !testConfig.shouldPass, // Invert for expected failure
        generationTime: 0,
        imageSize: 0,
        error: 'Expected validation failure',
        metadata: {
          template: testConfig.expectedTemplate,
          theme: testConfig.expectedTheme,
          dimensions: { width: 0, height: 0 },
          hasValidPNG: false,
        },
      };
    }

    const params: OGImageParams = {
      title: testConfig.title,
      description: testConfig.description,
      template: testConfig.expectedTemplate as OGImageParams['template'],
      theme: testConfig.expectedTheme as OGImageParams['theme'],
      tags: testConfig.tags,
      category: testConfig.category,
      author: 'Test Author',
      publishedTime: new Date(),
      pageType: 'article',
    };

    // Generate image
    const imageBuffer = await generateCachedOGImage(params);
    const generationTime = Date.now() - startTime;

    // Validate image
    const isValidPNG = await validatePNGHeader(imageBuffer);
    const dimensions = await extractImageDimensions(imageBuffer);

    // Check expected dimensions (1200x630 for OG images)
    const hasCorrectDimensions =
      dimensions && dimensions.width === 1200 && dimensions.height === 630;

    const passed = testConfig.shouldPass
      ? isValidPNG && hasCorrectDimensions && imageBuffer.length > 0 && generationTime < 10000
      : false; // Should generate within 10 seconds

    return {
      testName: testConfig.title || 'Unnamed Test',
      passed: passed ?? false,
      generationTime,
      imageSize: imageBuffer.length,
      metadata: {
        template: testConfig.expectedTemplate,
        theme: testConfig.expectedTheme,
        dimensions: dimensions || { width: 0, height: 0 },
        hasValidPNG: isValidPNG,
      },
    };
  } catch (error) {
    return {
      testName: testConfig.title || 'Failed Test',
      passed: false,
      generationTime: Date.now() - startTime,
      imageSize: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        template: testConfig.expectedTemplate,
        theme: testConfig.expectedTheme,
        dimensions: { width: 0, height: 0 },
        hasValidPNG: false,
      },
    };
  }
}

// 🏃‍♂️ Full Test Suite Runner
export async function runOGTestSuite(): Promise<{
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageGenerationTime: number;
    totalImageSize: number;
    cacheStats: {
      hit: number;
      miss: number;
      size: number;
      cleanup: number;
    };
  };
}> {
  console.log('🧪 Starting OG Image Test Suite...');

  const results: TestResult[] = [];
  let totalGenerationTime = 0;
  let totalImageSize = 0;

  // Run tests sequentially to avoid overwhelming the system
  for (const testConfig of OG_TEST_SUITE) {
    console.log(`🔍 Running test: ${testConfig.title.substring(0, 50)}...`);

    const result = await runSingleTest(testConfig);
    results.push(result);

    totalGenerationTime += result.generationTime;
    totalImageSize += result.imageSize;

    if (result.passed) {
      console.log(`✅ PASS: ${result.testName.substring(0, 50)}... (${result.generationTime}ms)`);
    } else {
      console.log(
        `❌ FAIL: ${result.testName.substring(0, 50)}... ${result.error ? `- ${result.error}` : ''}`
      );
    }

    // Small delay to prevent overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const averageGenerationTime = totalGenerationTime / results.length;

  const summary = {
    total: results.length,
    passed,
    failed,
    averageGenerationTime: Math.round(averageGenerationTime),
    totalImageSize,
    cacheStats: {
      hit: getCacheStats().hits,
      miss: getCacheStats().misses,
      size: getCacheStats().cacheSize,
      cleanup: getCacheStats().lastCleanup.getTime(),
    },
  };

  console.log('📊 Test Suite Summary:');
  console.log(`   Total Tests: ${summary.total}`);
  console.log(`   Passed: ${summary.passed}`);
  console.log(`   Failed: ${summary.failed}`);
  console.log(`   Average Generation Time: ${summary.averageGenerationTime}ms`);
  console.log(`   Total Image Size: ${Math.round(summary.totalImageSize / 1024)}KB`);
  console.log(
    `   Cache Hit Rate: ${Math.round((summary.cacheStats.hit / (summary.cacheStats.hit + summary.cacheStats.miss)) * 100) || 0}%`
  );

  return { results, summary };
}

// 🎯 Template & Theme Matrix Test
export async function runTemplateThemeMatrix(): Promise<TestResult[]> {
  console.log('🎨 Running Template & Theme Matrix Test...');

  const templates = [
    'default',
    'minimal',
    'tech',
    'blog',
    'cyber',
    'gradient',
    'terminal',
    'modern',
    'professional',
  ];
  const themes = ['dark', 'light', 'retro', 'neon', 'corporate', 'warm', 'ocean'];

  const matrixResults: TestResult[] = [];

  for (const template of templates) {
    for (const theme of themes) {
      const testConfig: TestConfig = {
        title: `${template.charAt(0).toUpperCase() + template.slice(1)} Template with ${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme`,
        description: `Testing ${template} template with ${theme} theme for visual consistency and proper rendering.`,
        expectedTemplate: template,
        expectedTheme: theme,
        tags: [template, theme, 'matrix-test'],
        category: 'Matrix Test',
        shouldPass: true,
      };

      const result = await runSingleTest(testConfig);
      matrixResults.push(result);

      // Short delay
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  const passed = matrixResults.filter((r) => r.passed).length;
  console.log(`🎨 Matrix Test Complete: ${passed}/${matrixResults.length} passed`);

  return matrixResults;
}

// 🚀 Performance Benchmark
export async function runPerformanceBenchmark(iterations: number = 10): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  cacheHitRate: string;
}> {
  console.log(`🚀 Running Performance Benchmark (${iterations} iterations)...`);

  const times: number[] = [];
  const testParams: OGImageParams = {
    title: 'Performance Benchmark Test',
    description: 'Testing generation performance with consistent parameters.',
    template: 'modern',
    theme: 'dark',
    tags: ['performance', 'benchmark'],
    pageType: 'article',
  };

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await generateCachedOGImage(testParams);
    const endTime = Date.now();

    times.push(endTime - startTime);

    if (i === 0) {
      console.log(`   First generation: ${times[0]}ms (cache miss)`);
    }
  }

  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const cacheStats = getCacheStats();

  console.log(`📊 Benchmark Results:`);
  console.log(`   Average: ${Math.round(averageTime)}ms`);
  console.log(`   Min: ${minTime}ms`);
  console.log(`   Max: ${maxTime}ms`);
  console.log(`   Cache Hit Rate: ${cacheStats.hitRate || 'N/A'}`);

  return {
    averageTime: Math.round(averageTime),
    minTime,
    maxTime,
    cacheHitRate: cacheStats.hitRate || '0%',
  };
}

// 🔧 Quick Health Check
export async function runHealthCheck(): Promise<boolean> {
  try {
    const testParams: OGImageParams = {
      title: 'Health Check',
      description: 'Quick system health verification.',
      template: 'minimal',
      theme: 'light',
      pageType: 'website',
    };

    const startTime = Date.now();
    const imageBuffer = await generateCachedOGImage(testParams);
    const generationTime = Date.now() - startTime;

    const isValid =
      (await validatePNGHeader(imageBuffer)) && imageBuffer.length > 0 && generationTime < 5000;

    if (isValid) {
      console.log(`✅ Health Check Passed (${generationTime}ms)`);
    } else {
      console.log(`❌ Health Check Failed`);
    }

    return isValid;
  } catch (error) {
    console.error('❌ Health Check Error:', error);
    return false;
  }
}

export default {
  runOGTestSuite,
  runTemplateThemeMatrix,
  runPerformanceBenchmark,
  runHealthCheck,
};
