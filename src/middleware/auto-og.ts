// 🎨 Automatic OG Image Middleware
// Intelligently applies OG image configuration to all pages

import { defineMiddleware } from 'astro:middleware';
import { buildSmartOGConfig, generatePageConfig, type PageOGConfig } from '../utils/og-page-config';

// 🎯 Page Pattern Matching
const PAGE_PATTERNS = {
  blog: /^\/blog\/.+/,
  project: /^\/project\/.+/,
  api: /^\/api\/.+/,
  static: /^\/(about|contact|services|resume|uses|videos|privacy|terms)$/,
} as const;

// 🚀 Auto OG Image Middleware
export const autoOGMiddleware = defineMiddleware(async (context, next) => {
  const { url, locals } = context;
  const pathname = url.pathname;

  // Skip API routes, assets, and other non-page requests
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_') ||
    pathname.includes('.') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.json')
  ) {
    return next();
  }

  try {
    // Generate automatic OG configuration for this page
    const autoConfig = generatePageConfig(pathname);

    // Store in locals for page components to access
    locals.autoOGConfig = autoConfig;

    // Add debugging info in development
    if (import.meta.env.DEV) {
      console.log(`🎨 Auto OG config for ${pathname}:`, {
        template: autoConfig.template,
        theme: autoConfig.theme,
        category: autoConfig.category,
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error generating auto OG config for ${pathname}:`, error);

    // Fallback configuration
    locals.autoOGConfig = {
      title: 'Piyush Mehta - Software Engineer',
      description: 'Professional software engineering and development services.',
      template: 'professional' as const,
      theme: 'corporate' as const,
    };
  }

  return next();
});

// 🎯 Smart Page Detection
export function detectPageType(
  pathname: string
): 'article' | 'website' | 'project' | 'about' | 'contact' | 'services' {
  if (PAGE_PATTERNS.blog.test(pathname)) return 'article';
  if (PAGE_PATTERNS.project.test(pathname)) return 'project';
  if (pathname.includes('about')) return 'about';
  if (pathname.includes('contact')) return 'contact';
  if (pathname.includes('service')) return 'services';
  return 'website';
}

// 🌟 Enhanced Config Builder for Components
export function getEnhancedOGConfig(
  pathname: string,
  frontmatter?: {
    title?: string;
    description?: string;
    tags?: string[];
    ogTemplate?: string;
    ogTheme?: string;
  }
): PageOGConfig {
  // If explicit OG configuration is provided, use it
  if (frontmatter?.ogTemplate && frontmatter?.ogTheme) {
    return {
      title: frontmatter.title || 'Piyush Mehta',
      description: frontmatter.description || 'Software Engineer',
      template: frontmatter.ogTemplate as PageOGConfig['template'],
      theme: frontmatter.ogTheme as PageOGConfig['theme'],
      tags: frontmatter.tags,
    };
  }

  // Build smart configuration
  const pageType = detectPageType(pathname);
  return buildSmartOGConfig(
    pathname,
    frontmatter?.title,
    frontmatter?.description,
    frontmatter?.tags,
    pageType
  );
}

// 🎨 Template Preview Generator (Development Only)
export function generateTemplatePreview() {
  if (!import.meta.env.DEV) return null;

  const allTemplates = [
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
  const allThemes = ['dark', 'light', 'retro', 'neon', 'corporate', 'warm', 'ocean'];

  return allTemplates
    .map((template) =>
      allThemes.map((theme) => ({
        template,
        theme,
        url: `/api/og-image?title=Template Preview&description=Testing ${template} template with ${theme} theme&template=${template}&theme=${theme}`,
      }))
    )
    .flat();
}

export default autoOGMiddleware;
