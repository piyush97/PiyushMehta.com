#!/usr/bin/env node

/**
 * Critical CSS Extraction Script
 * Extracts critical above-the-fold CSS for improved performance
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Add Sentry error monitoring for build scripts
let Sentry = null;
try {
  const sentryModule = await import('@sentry/node');
  Sentry = sentryModule;
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
  }
} catch (e) {
  // Sentry not available, continue without monitoring
  console.warn('Sentry not initialized for build scripts. Continuing without monitoring.', e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CriticalCSSExtractor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distDir = path.join(this.projectRoot, 'dist');
    this.srcDir = path.join(this.projectRoot, 'src');
    this.criticalCSS = new Map();
  }

  async extract() {
    console.log('🎨 Extracting critical CSS...');

    try {
      // Extract critical CSS for different page types
      await this.extractHomePageCSS();
      await this.extractBlogPageCSS();
      await this.extractBlogPostCSS();

      // Generate critical CSS files
      await this.generateCriticalCSSFiles();

      // Update layout with critical CSS
      await this.updateLayoutWithCriticalCSS();

      console.log('✅ Critical CSS extraction completed!');
    } catch (error) {
      console.error('❌ Critical CSS extraction failed:', error);

      // Log to Sentry if available
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            script: 'extract_critical_css',
            operation: 'extract',
          },
        });
      }

      throw error;
    }
  }

  async extractHomePageCSS() {
    console.log('  📄 Extracting homepage critical CSS...');

    const criticalRules = [
      // Layout fundamentals
      `html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }`,

      // Above-the-fold layout
      `.min-h-screen { min-height: 100vh; }`,
      `.flex { display: flex; }`,
      `.flex-col { flex-direction: column; }`,
      `.flex-1 { flex: 1 1 0%; }`,

      // Header/Navbar (always above fold)
      `.fixed { position: fixed; }`,
      `.top-0 { top: 0; }`,
      `.left-0 { left: 0; }`,
      `.right-0 { right: 0; }`,
      `.z-50 { z-index: 50; }`,
      `.h-16 { height: 4rem; }`,
      `.pt-16 { padding-top: 4rem; }`,

      // Typography for hero section
      `.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }`,
      `.text-5xl { font-size: 3rem; line-height: 1; }`,
      `.text-xl { font-size: 1.25rem; line-height: 1.75rem; }`,
      `.font-bold { font-weight: 700; }`,
      `.font-semibold { font-weight: 600; }`,

      // Colors (theme-aware)
      `:root {
        --color-text-primary: #1f2937;
        --color-text-secondary: #6b7280;
        --color-accent: #3b82f6;
        --color-surface-100: #f9fafb;
        --color-card-border: #e5e7eb;
      }`,

      `.professional-dark {
        --color-text-primary: #f9fafb;
        --color-text-secondary: #d1d5db;
        --color-accent: #60a5fa;
        --color-surface-100: #1f2937;
        --color-card-border: #374151;
      }`,

      // Theme transition prevention
      `.no-transition * { transition: none !important; }`,

      // Spacing utilities (commonly used above fold)
      `.container-base { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }`,
      `.mb-4 { margin-bottom: 1rem; }`,
      `.mb-6 { margin-bottom: 1.5rem; }`,
      `.mb-8 { margin-bottom: 2rem; }`,
      `.mt-8 { margin-top: 2rem; }`,
      `.px-4 { padding-left: 1rem; padding-right: 1rem; }`,
      `.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }`,
      `.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }`,

      // Loading states
      `.opacity-0 { opacity: 0; }`,
      `.invisible { visibility: hidden; }`,
      `.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 300ms; }`,
    ];

    this.criticalCSS.set('homepage', criticalRules.join('\n'));
  }

  async extractBlogPageCSS() {
    console.log('  📝 Extracting blog page critical CSS...');

    const criticalRules = [
      // Include homepage critical CSS
      ...(this.criticalCSS.get('homepage')?.split('\n') || []),

      // Blog-specific above-the-fold
      `.grid { display: grid; }`,
      `.gap-6 { gap: 1.5rem; }`,
      `.gap-8 { gap: 2rem; }`,
      `.md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }`,
      `.lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }`,

      // Card layouts
      `.rounded-lg { border-radius: 0.5rem; }`,
      `.border { border-width: 1px; }`,
      `.border-card-border { border-color: var(--color-card-border); }`,
      `.bg-surface-100 { background-color: var(--color-surface-100); }`,
      `.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }`,

      // Blog post preview cards
      `.aspect-video { aspect-ratio: 16 / 9; }`,
      `.object-cover { object-fit: cover; }`,
      `.overflow-hidden { overflow: hidden; }`,

      // Responsive utilities for blog grid
      `@media (min-width: 768px) {
        .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }`,

      `@media (min-width: 1024px) {
        .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }`,
    ];

    this.criticalCSS.set('blog', criticalRules.join('\n'));
  }

  async extractBlogPostCSS() {
    console.log('  📖 Extracting blog post critical CSS...');

    const criticalRules = [
      // Include homepage critical CSS
      ...(this.criticalCSS.get('homepage')?.split('\n') || []),

      // Reading progress (above fold)
      `#reading-progress-container { position: fixed; top: 0; left: 0; right: 0; z-index: 40; }`,
      `#reading-progress-bar { height: 0.25rem; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transition: width 150ms ease; }`,

      // Article header (above fold)
      `.prose { max-width: 65ch; margin: 0 auto; color: var(--color-text-primary); }`,
      `.prose h1 { font-size: 2.25rem; line-height: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; }`,
      `.prose h2 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }`,

      // Article metadata
      `.text-center { text-align: center; }`,
      `.text-light-400 { color: #9ca3af; }`,
      `.items-center { align-items: center; }`,
      `.justify-center { justify-content: center; }`,
      `.flex-wrap { flex-wrap: wrap; }`,

      // Breadcrumbs (above fold)
      `.inline-flex { display: inline-flex; }`,
      `.space-x-2 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.5rem; }`,

      // Code blocks (potentially above fold)
      `.code-block-container { background: #1a1b26; border-radius: 0.5rem; border: 1px solid var(--color-card-border); }`,
      `.bg-code-bg { background-color: #1a1b26; }`,

      // Mobile responsiveness for article
      `@media (max-width: 768px) {
        .prose h1 { font-size: 1.875rem; line-height: 2.25rem; }
        .container-base { padding: 0 0.75rem; }
      }`,
    ];

    this.criticalCSS.set('blogpost', criticalRules.join('\n'));
  }

  async generateCriticalCSSFiles() {
    console.log('  💾 Generating critical CSS files...');

    const criticalDir = path.join(this.srcDir, 'styles', 'critical');

    try {
      await fs.mkdir(criticalDir, { recursive: true });
    } catch (error) {
      console.error('    ❌ Failed to create critical CSS directory:', error.message);
      // Directory might already exist
    }

    // Generate individual critical CSS files
    for (const [pageType, css] of this.criticalCSS) {
      const filePath = path.join(criticalDir, `${pageType}.css`);

      // Minify CSS (basic minification)
      const minifiedCSS = css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .replace(/\s*{\s*/g, '{') // Clean up braces
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .trim();

      await fs.writeFile(filePath, minifiedCSS, 'utf8');
      console.log(`    ✓ Generated ${pageType}.css (${minifiedCSS.length} bytes)`);
    }

    // Generate combined critical CSS
    const combinedCSS = Array.from(this.criticalCSS.values()).join('\n');
    const combinedPath = path.join(criticalDir, 'combined.css');
    await fs.writeFile(combinedPath, combinedCSS, 'utf8');
    console.log(`    ✓ Generated combined.css (${combinedCSS.length} bytes)`);
  }

  async updateLayoutWithCriticalCSS() {
    console.log('  🔧 Updating layout with critical CSS...');

    const layoutPath = path.join(this.srcDir, 'layouts', 'Layout.astro');

    try {
      let layoutContent = await fs.readFile(layoutPath, 'utf8');

      // Check if critical CSS is already integrated
      if (layoutContent.includes('<!-- Critical CSS -->')) {
        console.log('    ⚠️  Critical CSS already integrated in layout');
        return;
      }

      // Find the head section and inject critical CSS
      const headInsertPoint = layoutContent.indexOf('</head>');

      if (headInsertPoint === -1) {
        throw new Error('Could not find </head> tag in Layout.astro');
      }

      const criticalCSSInsertion = `
    <!-- Critical CSS -->
    <style>
      /* Critical above-the-fold CSS inlined for performance */
      ${this.criticalCSS.get('homepage') || ''}
    </style>
    
    <!-- Preload main stylesheet -->
    <link rel="preload" href="/src/styles/global.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="/src/styles/global.css"></noscript>
    
`;

      layoutContent =
        layoutContent.slice(0, headInsertPoint) +
        criticalCSSInsertion +
        layoutContent.slice(headInsertPoint);

      await fs.writeFile(layoutPath, layoutContent, 'utf8');
      console.log('    ✓ Layout updated with critical CSS');
    } catch (error) {
      console.error('    ❌ Failed to update layout:', error.message);
      // Don't throw - this is not critical for the build
    }
  }

  // Utility method to analyze CSS usage
  async analyzeCSSUsage() {
    console.log('  📊 Analyzing CSS usage...');

    try {
      const globalCSSPath = path.join(this.srcDir, 'styles', 'global.css');
      const globalCSS = await fs.readFile(globalCSSPath, 'utf8');

      const stats = {
        totalRules: (globalCSS.match(/[{}]/g) || []).length / 2,
        totalSize: globalCSS.length,
        criticalSize: Array.from(this.criticalCSS.values()).join('').length,
      };

      stats.criticalPercentage = ((stats.criticalSize / stats.totalSize) * 100).toFixed(1);

      console.log(`    📈 CSS Analysis:`);
      console.log(`      Total CSS size: ${stats.totalSize} bytes`);
      console.log(`      Critical CSS size: ${stats.criticalSize} bytes`);
      console.log(`      Critical percentage: ${stats.criticalPercentage}%`);

      return stats;
    } catch (error) {
      console.error('    ❌ CSS analysis failed:', error.message);
      return null;
    }
  }
}

// Main execution
async function main() {
  const extractor = new CriticalCSSExtractor();

  try {
    await extractor.extract();
    await extractor.analyzeCSSUsage();

    console.log('\n🎉 Critical CSS extraction completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Review generated critical CSS files in src/styles/critical/');
    console.log('  2. Test page load performance');
    console.log('  3. Adjust critical CSS rules as needed');
  } catch (error) {
    console.error('\n💥 Critical CSS extraction failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CriticalCSSExtractor };
