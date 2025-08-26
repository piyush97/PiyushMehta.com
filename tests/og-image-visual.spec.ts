import fs from 'fs';
import path from 'path';
import { expect, test } from '@playwright/test';

// Visual regression test configuration
const visualTestConfig = {
  threshold: 0.1, // 10% difference threshold
  animations: 'disabled' as const,
  screenshots: {
    mode: 'only-on-failure' as const,
    fullPage: false,
  },
};

// Test scenarios for visual regression
const visualTestScenarios = [
  {
    name: 'modern-template-dark',
    params: {
      title: 'Modern Template Dark Theme',
      description: 'Testing modern template with dark theme for visual consistency',
      template: 'modern',
      theme: 'dark',
      tags: 'React,TypeScript,Web Development',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'tech-template-light',
    params: {
      title: 'Tech Professional Template',
      description: 'Testing tech template with light theme for visual consistency',
      template: 'tech',
      theme: 'light',
      tags: 'Technology,Professional,Business',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'terminal-template-dark',
    params: {
      title: 'const project = { name: "Terminal Test" }',
      description: 'Testing terminal template with code-like content',
      template: 'terminal',
      theme: 'dark',
      tags: 'Programming,Code,Development',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'cyber-template-neon',
    params: {
      title: 'Cyberpunk Neon Design',
      description: 'Testing cyberpunk template with neon effects',
      template: 'cyber',
      theme: 'dark',
      tags: 'Cyberpunk,Neon,Creative',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'minimal-template-clean',
    params: {
      title: 'Clean Minimal Design',
      description: 'Testing minimal template with clean design',
      template: 'minimal',
      theme: 'light',
      tags: 'Minimal,Clean,Simple',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'blog-template-article',
    params: {
      title: 'Building Modern Web Applications',
      description: 'Learn how to create scalable, maintainable web applications using modern development practices.',
      template: 'blog',
      theme: 'dark',
      type: 'article',
      tags: 'Blog,Article,Tutorial',
      readingTime: '8',
      date: '2024-01-15T00:00:00.000Z',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'long-title-handling',
    params: {
      title: 'This is a Very Long Title That Should Test the Dynamic Sizing Feature of the OG Image Generation System',
      description: 'Testing how the system handles extremely long titles and whether it adjusts font sizes appropriately for different content lengths.',
      template: 'modern',
      theme: 'dark',
      tags: 'Test,Long Content,Dynamic Sizing',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'short-content-handling',
    params: {
      title: 'Short',
      description: 'Brief.',
      template: 'modern',
      theme: 'dark',
      tags: 'Test',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
  {
    name: 'no-logo-no-badge',
    params: {
      title: 'No Visual Elements',
      description: 'Testing template without logo and badge elements',
      template: 'modern',
      theme: 'dark',
      tags: 'Test,No Logo,No Badge',
      showLogo: 'false',
      showBadge: 'false',
    },
  },
  {
    name: 'unicode-emoji-support',
    params: {
      title: 'Unicode Test: 🚀 React + TypeScript 📚',
      description: 'Testing Unicode and emoji support in OG images 🎨✨',
      template: 'modern',
      theme: 'dark',
      tags: 'Unicode,Emoji,Test',
      showLogo: 'true',
      showBadge: 'true',
    },
  },
];

test.describe('OG Image Visual Regression Tests', () => {
  test.use(visualTestConfig);

  test.beforeEach(async ({ page }) => {
    // Set up consistent viewport for visual tests
    await page.setViewportSize({ width: 1200, height: 630 });
  });

  visualTestScenarios.forEach(scenario => {
    test(`Visual regression test: ${scenario.name}`, async ({ page }) => {
      const params = new URLSearchParams(scenario.params);
      const url = `/api/og-image?${params}`;
      
      // Navigate to the OG image URL
      const response = await page.goto(url);
      
      // Ensure the request was successful
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
      
      // Get the image data
      const imageBuffer = await response?.body();
      expect(imageBuffer).toBeTruthy();
      
      // Save the image for visual comparison
      const testDir = path.join(process.cwd(), 'test-results', 'visual-regression');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const imagePath = path.join(testDir, `${scenario.name}.png`);
      fs.writeFileSync(imagePath, imageBuffer!);
      
      // Load the saved image in the browser for visual comparison
      await page.goto(`file://${imagePath}`);
      
      // Take a screenshot for visual regression testing
      await expect(page).toHaveScreenshot(`${scenario.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.1,
      });
    });
  });

  test.describe('Template Consistency Tests', () => {
    const templates = ['modern', 'tech', 'cyber', 'minimal', 'terminal', 'gradient', 'professional', 'dark'];
    
    templates.forEach(template => {
      test(`Template consistency: ${template}`, async ({ page }) => {
        const params = new URLSearchParams({
          title: `${template.charAt(0).toUpperCase() + template.slice(1)} Template Test`,
          description: 'Consistent content for template comparison',
          template: template,
          theme: 'dark',
          tags: 'Template,Test,Consistency',
          showLogo: 'true',
          showBadge: 'true',
        });
        
        const response = await page.goto(`/api/og-image?${params}`);
        
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
        
        // Save image for comparison
        const imageBuffer = await response?.body();
        const testDir = path.join(process.cwd(), 'test-results', 'template-consistency');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        const imagePath = path.join(testDir, `template-${template}.png`);
        fs.writeFileSync(imagePath, imageBuffer!);
      });
    });
  });

  test.describe('Theme Consistency Tests', () => {
    const themes = ['dark', 'light', 'auto'];
    
    themes.forEach(theme => {
      test(`Theme consistency: ${theme}`, async ({ page }) => {
        const params = new URLSearchParams({
          title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme Test`,
          description: 'Consistent content for theme comparison',
          template: 'modern',
          theme: theme,
          tags: 'Theme,Test,Consistency',
          showLogo: 'true',
          showBadge: 'true',
        });
        
        const response = await page.goto(`/api/og-image?${params}`);
        
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
        
        // Save image for comparison
        const imageBuffer = await response?.body();
        const testDir = path.join(process.cwd(), 'test-results', 'theme-consistency');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        const imagePath = path.join(testDir, `theme-${theme}.png`);
        fs.writeFileSync(imagePath, imageBuffer!);
      });
    });
  });

  test.describe('Content Type Visual Tests', () => {
    const contentTypes = [
      {
        type: 'article',
        title: 'Building Modern Web Applications',
        description: 'Learn how to create scalable, maintainable web applications.',
        extraParams: { readingTime: '8', date: '2024-01-15T00:00:00.000Z' },
      },
      {
        type: 'project',
        title: 'React Developer Portfolio',
        description: 'A modern, responsive portfolio website.',
        extraParams: {},
      },
      {
        type: 'website',
        title: 'The Future of Web Development',
        description: 'A deep dive into emerging technologies.',
        extraParams: {},
      },
    ];

    contentTypes.forEach(contentType => {
      test(`Content type visual: ${contentType.type}`, async ({ page }) => {
        const params = new URLSearchParams({
          title: contentType.title,
          description: contentType.description,
          type: contentType.type,
          template: 'modern',
          theme: 'dark',
          tags: 'Test,Visual,Content',
          showLogo: 'true',
          showBadge: 'true',
          ...contentType.extraParams,
        });
        
        const response = await page.goto(`/api/og-image?${params}`);
        
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-type']).toBe('image/png');
        
        // Save image for comparison
        const imageBuffer = await response?.body();
        const testDir = path.join(process.cwd(), 'test-results', 'content-type-visual');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        const imagePath = path.join(testDir, `content-${contentType.type}.png`);
        fs.writeFileSync(imagePath, imageBuffer!);
      });
    });
  });

  test.describe('Edge Cases Visual Tests', () => {
    test('Empty parameters visual test', async ({ page }) => {
      const response = await page.goto('/api/og-image');
      
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
      
      const imageBuffer = await response?.body();
      const testDir = path.join(process.cwd(), 'test-results', 'edge-cases');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const imagePath = path.join(testDir, 'empty-parameters.png');
      fs.writeFileSync(imagePath, imageBuffer!);
    });

    test('Maximum tags visual test', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Maximum Tags Test',
        description: 'Testing maximum number of tags display',
        template: 'modern',
        theme: 'dark',
        tags: 'Tag1,Tag2,Tag3,Tag4,Tag5,Tag6,Tag7,Tag8,Tag9,Tag10',
        showLogo: 'true',
        showBadge: 'true',
      });
      
      const response = await page.goto(`/api/og-image?${params}`);
      
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
      
      const imageBuffer = await response?.body();
      const testDir = path.join(process.cwd(), 'test-results', 'edge-cases');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const imagePath = path.join(testDir, 'maximum-tags.png');
      fs.writeFileSync(imagePath, imageBuffer!);
    });

    test('Special characters visual test', async ({ page }) => {
      const params = new URLSearchParams({
        title: 'Special Characters: <>&"\'',
        description: 'Testing special characters: @#$%^&*()_+-=[]{}|;:,.<>?',
        template: 'modern',
        theme: 'dark',
        tags: 'Special,Characters,Test',
        showLogo: 'true',
        showBadge: 'true',
      });
      
      const response = await page.goto(`/api/og-image?${params}`);
      
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toBe('image/png');
      
      const imageBuffer = await response?.body();
      const testDir = path.join(process.cwd(), 'test-results', 'edge-cases');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const imagePath = path.join(testDir, 'special-characters.png');
      fs.writeFileSync(imagePath, imageBuffer!);
    });
  });
});