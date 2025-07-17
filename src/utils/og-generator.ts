/**
 * Enhanced OG Image Generator Utility
 * Inspired by Syntax FM's approach with modern enhancements
 */

export interface OGImageOptions {
  title: string;
  description?: string;
  type?: 'website' | 'article' | 'project';
  template?: 'modern' | 'tech' | 'cyber' | 'minimal' | 'terminal' | 'gradient' | 'professional' | 'dark' | 'blog';
  theme?: 'dark' | 'light' | 'auto';
  author?: string;
  date?: string | Date;
  tags?: string[];
  readingTime?: string;
  showLogo?: boolean;
  showBadge?: boolean;
  language?: string;
  baseUrl?: string;
}

export interface OGImageResult {
  url: string;
  alt: string;
  width: number;
  height: number;
  type: string;
}

// Template configurations with design patterns
export const OG_TEMPLATES = {
  modern: {
    name: 'Modern Glass',
    description: 'Clean glass morphism with subtle animations',
    bestFor: ['business', 'portfolio', 'professional'],
    features: ['glass-morphism', 'minimal-design', 'backdrop-blur'],
  },
  tech: {
    name: 'Tech Professional',
    description: 'Professional tech design with modern elements',
    bestFor: ['technology', 'enterprise', 'b2b'],
    features: ['professional-design', 'tech-elements', 'corporate-style'],
  },
  cyber: {
    name: 'Cyberpunk Neon',
    description: 'Neon colors with futuristic elements',
    bestFor: ['tech', 'gaming', 'creative'],
    features: ['neon-effects', 'dark-theme', 'glowing-elements'],
  },
  minimal: {
    name: 'Clean Minimal',
    description: 'Simple, elegant design with focus on content',
    bestFor: ['articles', 'documentation', 'clean-design'],
    features: ['minimal-design', 'light-theme', 'typography-focus'],
  },
  terminal: {
    name: 'Developer Terminal',
    description: 'Code editor styled with syntax highlighting',
    bestFor: ['programming', 'tutorials', 'tech-articles'],
    features: ['code-styling', 'syntax-highlighting', 'terminal-ui'],
  },
  gradient: {
    name: 'Gradient Design',
    description: 'Vibrant gradients with modern glass effects',
    bestFor: ['creative', 'blog', 'general'],
    features: ['glass-morphism', 'animated-gradients', 'floating-elements'],
  },
  professional: {
    name: 'Professional',
    description: 'Clean professional design for business',
    bestFor: ['business', 'consulting', 'corporate'],
    features: ['professional-design', 'clean-layout', 'corporate-style'],
  },
  dark: {
    name: 'Dark Theme',
    description: 'Modern dark design with accent colors',
    bestFor: ['tech', 'development', 'modern'],
    features: ['dark-theme', 'modern-design', 'accent-colors'],
  },
  blog: {
    name: 'Blog Article',
    description: 'Optimized for blog posts with reading metadata',
    bestFor: ['articles', 'blog-posts', 'content-marketing'],
    features: ['reading-time', 'article-metadata', 'content-focus'],
  },
} as const;

/**
 * Generate OG image URL with enhanced parameters
 */
export function generateOGImageUrl(options: OGImageOptions): string {
  const {
    title,
    description,
    type = 'website',
    template = 'modern',
    theme = 'dark',
    author = 'Piyush Mehta',
    date,
    tags = [],
    _episode,
    readingTime,
    showLogo = true,
    showBadge = true,
    language = 'javascript',
    baseUrl = 'https://piyushmehta.com',
  } = options;

  // Use the enhanced OG API endpoint
  const apiUrl = `${baseUrl}/api/og-enhanced`;
  const params = new URLSearchParams();

  // Core parameters
  params.set('title', title);
  if (description) params.set('description', description);
  params.set('type', type);
  params.set('template', template);
  params.set('theme', theme);
  params.set('author', author);

  // Optional parameters
  if (date) {
    const dateStr = date instanceof Date ? date.toISOString() : date;
    params.set('date', dateStr);
  }
  if (tags.length > 0) params.set('tags', tags.join(','));
  if (readingTime) params.set('readingTime', readingTime);
  if (language) params.set('language', language);
  
  // UI options
  params.set('showLogo', showLogo.toString());
  params.set('showBadge', showBadge.toString());

  return `${apiUrl}?${params.toString()}`;
}

/**
 * Generate OG image metadata object
 */
export function generateOGImageMetadata(options: OGImageOptions): OGImageResult {
  const url = generateOGImageUrl(options);
  const alt = `${options.title} - ${options.author || 'Piyush Mehta'}`;

  return {
    url,
    alt,
    width: 1200,
    height: 630,
    type: 'image/png',
  };
}

/**
 * Generate dynamic OG image for blog posts
 */
export function generateBlogOGImage(options: {
  title: string;
  description?: string;
  publishedDate?: Date;
  tags?: string[];
  readingTime?: string;
  template?: keyof typeof OG_TEMPLATES;
}): OGImageResult {
  return generateOGImageMetadata({
    ...options,
    type: 'article',
    template: options.template || 'blog',
    date: options.publishedDate,
    showBadge: true,
    showLogo: true,
  });
}

/**
 * Generate dynamic OG image for projects
 */
export function generateProjectOGImage(options: {
  title: string;
  description?: string;
  tags?: string[];
  template?: keyof typeof OG_TEMPLATES;
}): OGImageResult {
  return generateOGImageMetadata({
    ...options,
    type: 'project',
    template: options.template || 'modern',
    showBadge: true,
    showLogo: true,
  });
}

/**
 * Generate dynamic OG image for talks and presentations
 */
export function generateTalkOGImage(options: {
  title: string;
  description?: string;
  eventName?: string;
  eventDate?: Date;
  tags?: string[];
}): OGImageResult {
  return generateOGImageMetadata({
    ...options,
    type: 'website',
    template: 'tech',
    date: options.eventDate,
    showBadge: true,
    showLogo: true,
  });
}

/**
 * Get template recommendation based on content type
 */
export function getRecommendedTemplate(
  type: OGImageOptions['type'],
  tags?: string[]
): keyof typeof OG_TEMPLATES {
  // AI-powered template selection based on content analysis
  const contentKeywords = tags?.join(' ').toLowerCase() || '';
  
  if (type === 'article') {
    if (contentKeywords.includes('programming') || contentKeywords.includes('code')) {
      return 'terminal';
    }
    if (contentKeywords.includes('design') || contentKeywords.includes('creative')) {
      return 'modern';
    }
    return 'blog';
  }
  if (type === 'project') {
    if (contentKeywords.includes('game') || contentKeywords.includes('creative')) {
      return 'cyber';
    }
    if (contentKeywords.includes('business') || contentKeywords.includes('enterprise')) {
      return 'tech';
    }
    return 'modern';
  }
  
  return 'modern'; // Default fallback
}

/**
 * Validate OG image options
 */
export function validateOGImageOptions(options: OGImageOptions): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Title validation
  if (!options.title) {
    warnings.push('Title is required for OG images');
  } else if (options.title.length > 100) {
    warnings.push('Title is too long (>100 characters), may be truncated');
    suggestions.push('Consider shortening the title to 60-80 characters');
  }

  // Description validation
  if (options.description && options.description.length > 200) {
    warnings.push('Description is too long (>200 characters), may be truncated');
    suggestions.push('Consider shortening the description to 120-150 characters');
  }

  // Template validation
  const template = options.template || 'modern';
  if (!OG_TEMPLATES[template]) {
    warnings.push(`Unknown template: ${template}`);
    suggestions.push(`Available templates: ${Object.keys(OG_TEMPLATES).join(', ')}`);
  }

  // Tags validation
  if (options.tags && options.tags.length > 5) {
    warnings.push('Too many tags (>5), only first 4 will be displayed');
    suggestions.push('Limit to 3-4 most relevant tags');
  }

  // Performance suggestions
  if (options.showLogo && options.showBadge && options.tags && options.tags.length > 3) {
    suggestions.push('Consider reducing visual elements for better readability');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

/**
 * Cache-friendly OG image URL generation
 */
export function generateCacheOptimizedOGUrl(options: OGImageOptions): string {
  // Create a stable hash for caching
  const cacheKey = JSON.stringify({
    title: options.title,
    description: options.description,
    template: options.template,
    type: options.type,
    theme: options.theme,
  });
  
  const hash = btoa(cacheKey).replace(/[+/=]/g, '').substring(0, 8);
  
  return `${generateOGImageUrl(options)}&cache=${hash}`;
}

/**
 * Generate Twitter-optimized OG image
 */
export function generateTwitterOGImage(options: OGImageOptions): OGImageResult {
  // Twitter prefers specific templates and sizing
  const twitterOptions: OGImageOptions = {
    ...options,
    template: options.template === 'terminal' ? 'tech' : options.template,
    showLogo: false, // Twitter crops logos
    description: options.description?.substring(0, 125), // Twitter limits
  };

  return generateOGImageMetadata(twitterOptions);
}

/**
 * A/B test different OG image templates
 */
export function generateABTestOGImages(options: OGImageOptions): {
  primary: OGImageResult;
  variant: OGImageResult;
} {
  const primary = generateOGImageMetadata(options);
  
  // Generate variant with different template
  const variantTemplate = options.template === 'modern' ? 'tech' : 'modern';
  const variant = generateOGImageMetadata({
    ...options,
    template: variantTemplate,
  });

  return { primary, variant };
}

/**
 * Export all utilities
 */
export default {
  generateOGImageUrl,
  generateOGImageMetadata,
  generateBlogOGImage,
  generateProjectOGImage,
  generateTalkOGImage,
  getRecommendedTemplate,
  validateOGImageOptions,
  generateCacheOptimizedOGUrl,
  generateTwitterOGImage,
  generateABTestOGImages,
  OG_TEMPLATES,
};