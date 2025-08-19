// Critical CSS extraction and optimization utilities
import { promises as fs } from 'fs';
import path from 'path';

interface CriticalCSSConfig {
  width: number;
  height: number;
  enableGoogleFonts: boolean;
  enableInlineCSS: boolean;
  enableMinification: boolean;
  ignoreCSSRules: string[];
  prioritySelectors: string[];
}

export class CriticalCSSExtractor {
  private config: CriticalCSSConfig;
  private extractedCSS: Map<string, string> = new Map();

  constructor(config: Partial<CriticalCSSConfig> = {}) {
    this.config = {
      width: 1300,
      height: 900,
      enableGoogleFonts: true,
      enableInlineCSS: true,
      enableMinification: true,
      ignoreCSSRules: [
        '@media print',
        '@media \\(max-width: 767px\\)',
        'transform: translate3d',
        'will-change',
      ],
      prioritySelectors: [
        'html',
        'body',
        'header',
        'nav',
        'main',
        '.hero',
        '.above-fold',
        'h1',
        'h2',
        '.btn',
        '.navbar',
      ],
      ...config,
    };
  }

  /**
   * Extract critical CSS for above-the-fold content
   */
  async extractCriticalCSS(htmlContent: string, cssFilePath?: string): Promise<string> {
    try {
      let cssContent = '';

      if (cssFilePath && (await this.fileExists(cssFilePath))) {
        cssContent = await fs.readFile(cssFilePath, 'utf-8');
      } else {
        // Extract inline styles and linked stylesheets from HTML
        cssContent = await this.extractCSSFromHTML(htmlContent);
      }

      // Parse CSS and extract critical styles
      const criticalCSS = this.parseAndExtractCritical(cssContent, htmlContent);

      // Optimize and minify if enabled
      const optimizedCSS = this.config.enableMinification
        ? this.minifyCSS(criticalCSS)
        : criticalCSS;

      return optimizedCSS;
    } catch (error) {
      console.warn('Critical CSS extraction failed:', error);
      return '';
    }
  }

  /**
   * Generate critical CSS for different page types
   */
  async generateCriticalCSSByPageType(
    pageType: 'home' | 'blog' | 'post' | 'generic'
  ): Promise<string> {
    const cacheKey = `critical-${pageType}`;

    if (this.extractedCSS.has(cacheKey)) {
      return this.extractedCSS.get(cacheKey)!;
    }

    const selectors: string[] = [...this.config.prioritySelectors];

    // Add page-specific selectors
    switch (pageType) {
      case 'home':
        selectors.push(
          '.hero-section',
          '.intro',
          '.featured-posts',
          '.tech-stack',
          '.newsletter-signup'
        );
        break;
      case 'blog':
        selectors.push('.blog-header', '.post-grid', '.post-card', '.pagination', '.search-box');
        break;
      case 'post':
        selectors.push(
          '.post-header',
          '.post-content',
          '.post-meta',
          '.reading-progress',
          '.author-bio'
        );
        break;
      default:
        selectors.push('.page-header', '.content-area');
    }

    const criticalCSS = await this.buildCriticalCSS(selectors);
    this.extractedCSS.set(cacheKey, criticalCSS);

    return criticalCSS;
  }

  /**
   * Inline critical CSS in HTML head
   */
  inlineCriticalCSS(htmlContent: string, criticalCSS: string): string {
    if (!this.config.enableInlineCSS || !criticalCSS.trim()) {
      return htmlContent;
    }

    const inlineStyleTag = `
    <style data-critical-css>
      ${criticalCSS}
    </style>`;

    // Insert before closing head tag
    return htmlContent.replace('</head>', `${inlineStyleTag}\n</head>`);
  }

  /**
   * Create preload links for non-critical CSS
   */
  createPreloadLinks(cssFiles: string[]): string {
    return cssFiles
      .map(
        (file) =>
          `<link rel="preload" href="${file}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
      )
      .join('\n');
  }

  /**
   * Generate font preload links for Google Fonts
   */
  generateFontPreloads(googleFonts: string[]): string {
    if (!this.config.enableGoogleFonts) return '';

    const fontPreloads = googleFonts
      .map((font) => {
        // Convert font name to URL format
        const fontUrl = font.replace(/\s+/g, '+');
        return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=${fontUrl}" as="style">`;
      })
      .join('\n');

    return fontPreloads;
  }

  private async extractCSSFromHTML(htmlContent: string): Promise<string> {
    let cssContent = '';

    // Extract inline styles
    const inlineStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    while ((match = inlineStyleRegex.exec(htmlContent)) !== null) {
      cssContent += `${match[1]}\n`;
    }

    // Extract linked stylesheets (for build-time extraction)
    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    while ((match = linkRegex.exec(htmlContent)) !== null) {
      const href = match[1];
      if (href.startsWith('/') && !href.startsWith('//')) {
        try {
          const cssFile = await fs.readFile(path.join(process.cwd(), 'dist', href), 'utf-8');
          cssContent += `${cssFile}\n`;
        } catch (_error) {
          console.warn(`Could not read CSS file: ${href}`);
        }
      }
    }

    return cssContent;
  }

  private parseAndExtractCritical(cssContent: string, htmlContent: string): string {
    const criticalRules: string[] = [];

    // Simple CSS rule extraction (in production, use a proper CSS parser)
    const cssRules = cssContent
      .split('}')
      .map((rule) => `${rule.trim()}}`)
      .filter(Boolean);

    for (const rule of cssRules) {
      if (this.isRuleCritical(rule, htmlContent)) {
        criticalRules.push(rule);
      }
    }

    return criticalRules.join('\n');
  }

  private isRuleCritical(cssRule: string, htmlContent: string): boolean {
    // Skip ignored rules
    for (const ignoredRule of this.config.ignoreCSSRules) {
      if (new RegExp(ignoredRule, 'i').test(cssRule)) {
        return false;
      }
    }

    // Check if rule matches priority selectors
    for (const selector of this.config.prioritySelectors) {
      if (cssRule.includes(selector)) {
        return true;
      }
    }

    // Extract selector from rule and check if it exists in HTML
    const selectorMatch = cssRule.match(/^([^{]+)\s*\{/);
    if (selectorMatch) {
      const selector = selectorMatch[1].trim();

      // Convert CSS selector to a regex pattern for HTML matching
      const selectorPattern = selector
        .replace(/\./g, 'class="[^"]*\\b')
        .replace(/#/g, 'id="')
        .replace(/\s+/g, '.*');

      try {
        return new RegExp(selectorPattern, 'i').test(htmlContent);
      } catch (_error) {
        // If regex fails, fall back to simple string matching
        return htmlContent.includes(selector.replace(/[.#]/g, ''));
      }
    }

    return false;
  }

  private async buildCriticalCSS(selectors: string[]): Promise<string> {
    // This would integrate with the existing CSS files
    // For now, return a basic critical CSS template
    const criticalCSS = `
      /* Critical CSS - Above the fold styles */
      html { font-family: system-ui, -apple-system, sans-serif; }
      body { margin: 0; padding: 0; line-height: 1.6; }
      
      /* Priority selectors */
      ${selectors.map((selector) => `${selector} { display: block; }`).join('\n')}
      
      /* Essential layout */
      header, nav, main { display: block; width: 100%; }
      h1, h2, h3 { margin: 0 0 1rem 0; font-weight: 600; }
      
      /* Loading states */
      .loading { opacity: 0.6; pointer-events: none; }
      .loaded { opacity: 1; transition: opacity 0.3s ease; }
    `;

    return this.minifyCSS(criticalCSS);
  }

  private minifyCSS(css: string): string {
    if (!this.config.enableMinification) return css;

    return (
      css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove whitespace around specific characters
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remove trailing semicolon before closing brace
        .replace(/;}/g, '}')
        // Remove empty rules
        .replace(/[^{}]+\{\s*\}/g, '')
        .trim()
    );
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export utility functions
export const criticalCSSExtractor = new CriticalCSSExtractor();

export async function generateCriticalCSS(
  pageType: 'home' | 'blog' | 'post' | 'generic' = 'generic'
): Promise<string> {
  return criticalCSSExtractor.generateCriticalCSSByPageType(pageType);
}

export function inlineCriticalCSS(html: string, css: string): string {
  return criticalCSSExtractor.inlineCriticalCSS(html, css);
}
