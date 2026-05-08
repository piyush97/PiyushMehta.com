/**
 * Enhanced OG Image Generator Utility
 * Inspired by Syntax FM's approach with modern enhancements
 */

export interface OGImageOptions {
  title: string;
  description?: string;
  type?: 'website' | 'article' | 'project';
  template?: 'modern' | 'tech' | 'blog' | 'minimal' | 'professional';
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
  blog: {
    name: 'Blog Article',
    description: 'Optimized for blog posts with reading metadata',
    bestFor: ['articles', 'blog-posts', 'content-marketing'],
    features: ['reading-time', 'article-metadata', 'content-focus'],
  },
  minimal: {
    name: 'Clean Minimal',
    description: 'Simple, elegant design with focus on content',
    bestFor: ['articles', 'documentation', 'clean-design'],
    features: ['minimal-design', 'light-theme', 'typography-focus'],
  },
  professional: {
    name: 'Professional',
    description: 'Clean professional design for business',
    bestFor: ['business', 'consulting', 'corporate'],
    features: ['professional-design', 'clean-layout', 'corporate-style'],
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
  // Template selection based on content analysis
  const contentKeywords = tags?.join(' ').toLowerCase() || '';

  if (type === 'article') {
    if (contentKeywords.includes('programming') || contentKeywords.includes('code')) {
      return 'tech';
    }
    if (contentKeywords.includes('design') || contentKeywords.includes('creative')) {
      return 'modern';
    }
    return 'blog';
  }
  if (type === 'project') {
    if (contentKeywords.includes('business') || contentKeywords.includes('enterprise')) {
      return 'professional';
    }
    return 'tech';
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
    template: options.template === 'tech' ? 'tech' : 'modern',
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
 * Image metadata interface for OG Protocol compliance
 */
export interface ImageMetadata {
  url: string;
  secureUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
}

/**
 * Extract image metadata for OG Protocol compliance with @vercel/og fallback
 */
export function extractImageMetadata(
  image:
    | { url: string; alt?: string; width?: number; height?: number; type?: string }
    | string
    | null,
  baseUrl?: string,
  fallbackParams?: {
    title: string;
    description?: string;
    type?: string;
    publishedTime?: Date;
    tags?: string[];
    template?: 'default' | 'minimal' | 'tech' | 'blog';
    theme?: 'dark' | 'light' | 'retro';
  }
): ImageMetadata {
  // Ensure we have a baseUrl
  if (!baseUrl) {
    throw new Error('baseUrl is required for extractImageMetadata');
  }

  // If we have a specific image, use it
  if (image) {
    if (typeof image === 'string') {
      const resolvedUrl = resolveImageUrl(image, baseUrl);
      return {
        url: resolvedUrl,
        secureUrl: generateSecureImageUrl(resolvedUrl),
        type: getImageTypeFromUrl(resolvedUrl),
        width: getDefaultImageWidth(resolvedUrl),
        height: getDefaultImageHeight(resolvedUrl),
      };
    }

    const resolvedUrl = resolveImageUrl(image.url, baseUrl);
    const secureUrl = generateSecureImageUrl(resolvedUrl);

    return {
      url: resolvedUrl,
      secureUrl: secureUrl,
      alt: image.alt,
      width: image.width || getDefaultImageWidth(resolvedUrl),
      height: image.height || getDefaultImageHeight(resolvedUrl),
      type: image.type || getImageTypeFromUrl(resolvedUrl),
    };
  }

  // Fallback to generated OG image
  if (fallbackParams) {
    const ogImageUrl = generateOGImageUrl({
      title: fallbackParams.title,
      description: fallbackParams.description,
      type: (fallbackParams.type as 'website' | 'article' | 'project') || 'website',
      template: (fallbackParams.template as keyof typeof OG_TEMPLATES) || 'modern',
      theme: (fallbackParams.theme as 'dark' | 'light' | 'auto') || 'dark',
      date: fallbackParams.publishedTime,
      tags: fallbackParams.tags,
      baseUrl,
    });
    return {
      url: ogImageUrl,
      secureUrl: ogImageUrl, // Generated images always serve HTTPS
      type: 'image/png', // Generated PNG images using resvg-js
      width: 1200, // Standard OG image dimensions
      height: 630,
      alt: `${fallbackParams.title} - Piyush Mehta`,
    };
  }

  // Final fallback to a default static image
  const fallbackImageUrl = new URL('/images/social.jpg', baseUrl).toString();

  return {
    url: fallbackImageUrl,
    secureUrl: fallbackImageUrl,
    type: 'image/jpeg',
    width: 1200,
    height: 630,
    alt: 'Piyush Mehta - Software Engineer & Tech Speaker',
  };
}

/**
 * Generate canonical URL with proper trailing slash handling
 */
export function generateCanonicalUrl(path: string = '', baseUrl?: string): string {
  if (!baseUrl) {
    throw new Error('baseUrl is required for generateCanonicalUrl');
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  // Ensure consistent trailing slash handling
  if (cleanPath !== '/' && url.endsWith('/')) {
    return url.slice(0, -1);
  }

  return url;
}

/**
 * Generate structured data for different page types
 */
export function generateStructuredData(params: {
  type: 'website' | 'article';
  title: string;
  description: string;
  url: string;
  author?: string;
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
  image?: string;
}) {
  const {
    type,
    title,
    description,
    url,
    author = 'Piyush Mehta',
    publishedTime,
    modifiedTime,
    tags = [],
    image,
  } = params;

  const baseSchema = {
    '@context': 'https://schema.org',
    headline: title,
    description: description,
    author: {
      '@type': 'Person',
      name: author,
      url: new URL('/', url).origin,
      sameAs: [
        'https://github.com/piyush97',
        'https://linkedin.com/in/piyush24',
        'https://twitter.com/piyushmehtas',
      ],
    },
    url: url,
  };

  if (type === 'article') {
    return {
      ...baseSchema,
      '@type': 'Article',
      ...(publishedTime && { datePublished: publishedTime.toISOString() }),
      ...(modifiedTime && { dateModified: modifiedTime.toISOString() }),
      ...(publishedTime && !modifiedTime && { dateModified: publishedTime.toISOString() }),
      keywords: tags.join(', '),
      articleSection: 'Technology',
      publisher: {
        '@type': 'Person',
        name: author,
        url: new URL('/', url).origin,
      },
      ...(image && { image: image }),
    };
  }

  return {
    ...baseSchema,
    '@type': 'WebPage',
  };
}

/**
 * Generate Twitter-optimized image URL
 */
export function generateTwitterImageUrl(options: {
  title: string;
  description?: string;
  type?: string;
  publishedTime?: Date;
  tags?: string[];
  template?: 'default' | 'minimal' | 'tech' | 'blog' | 'twitter';
  theme?: 'dark' | 'light';
  baseUrl?: string;
}): string {
  const {
    title,
    description,
    type,
    publishedTime,
    tags = [],
    template = 'twitter',
    theme = 'dark',
    baseUrl,
  } = options;

  // Ensure we have a baseUrl
  if (!baseUrl) {
    throw new Error('baseUrl is required for generateTwitterImageUrl');
  }

  // Map legacy templates to enhanced templates
  const templateMapping = {
    default: 'modern',
    minimal: 'minimal',
    tech: 'tech',
    blog: 'blog',
    twitter: 'modern',
  } as const;

  // Use the enhanced OG generator for better Twitter optimization
  const searchParams = new URLSearchParams();
  searchParams.set('title', title);
  searchParams.set(
    'template',
    templateMapping[template as keyof typeof templateMapping] || 'modern'
  );
  searchParams.set('theme', theme);
  searchParams.set('showLogo', 'false'); // Twitter crops logos
  searchParams.set('showBadge', 'true');

  if (description) {
    // Twitter prefers shorter descriptions
    const twitterDescription =
      description.length > 125 ? `${description.substring(0, 125)}...` : description;
    searchParams.set('description', twitterDescription);
  }

  if (type) {
    searchParams.set('type', type);
  }

  if (publishedTime) {
    searchParams.set('date', publishedTime.toISOString());
  }

  if (tags && tags.length > 0) {
    searchParams.set('tags', tags.join(','));
  }

  // Use the enhanced OG API endpoint
  return `${baseUrl}/api/og-enhanced?${searchParams.toString()}`;
}

/**
 * Optimize and deduplicate keywords
 */
export function optimizeKeywords(keywords: string[], tags: string[] = []): string {
  const defaultKeywords = [
    'Piyush Mehta',
    'React Developer',
    'Software Engineer',
    'Software Engineer in Canada',
    'ReactJS Developer',
    'Canadian Developer',
  ];

  // Combine all keywords and remove duplicates (case-insensitive)
  const allKeywords = [...defaultKeywords, ...keywords, ...tags];
  const uniqueKeywords = Array.from(new Set(allKeywords.map((k) => k.toLowerCase()))).map((k) => {
    // Find the original casing from the first occurrence
    return allKeywords.find((original) => original.toLowerCase() === k) || k;
  });

  return uniqueKeywords.join(', ');
}

/**
 * Validate and sanitize meta description
 */
export function sanitizeDescription(description: string, maxLength: number = 160): string {
  // Strip angle brackets (prevents HTML injection via incomplete tag regexes)
  const cleaned = description.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Truncate at word boundary
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return `${truncated.slice(0, lastSpace)}...`;
  }

  return `${truncated}...`;
}

/**
 * Validate image for social sharing
 */
export function validateImageForSocialSharing(imageMetadata: ImageMetadata): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;

  // Check URL
  if (!imageMetadata.url) {
    warnings.push('Image URL is required');
    isValid = false;
  }

  // Check dimensions
  if (imageMetadata.width && imageMetadata.width < 200) {
    warnings.push('Image width should be at least 200px for optimal social sharing');
  }

  if (imageMetadata.height && imageMetadata.height < 200) {
    warnings.push('Image height should be at least 200px for optimal social sharing');
  }

  // Check alt text
  if (!imageMetadata.alt) {
    warnings.push('Alt text is recommended for accessibility and SEO');
  }

  // Check secure URL
  if (!imageMetadata.secureUrl || !imageMetadata.secureUrl.startsWith('https://')) {
    warnings.push('HTTPS image URL is recommended for social sharing');
  }

  return { isValid, warnings };
}

/**
 * Resolve image URL to absolute URL
 */
function resolveImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';
  if (!baseUrl) {
    throw new Error('baseUrl is required for resolveImageUrl');
  }

  // Already absolute URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Convert relative URL to absolute
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Generate secure URL for images (HTTPS version)
 */
function generateSecureImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';

  // Already HTTPS
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Convert HTTP to HTTPS
  if (imageUrl.startsWith('http://')) {
    return imageUrl.replace('http://', 'https://');
  }

  // For relative URLs, return as-is (should be resolved first by resolveImageUrl)
  return imageUrl;
}

/**
 * Get image MIME type from URL extension
 */
function getImageTypeFromUrl(imageUrl: string): string {
  const extension = imageUrl.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/jpeg';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Get default image width for OG images
 */
function getDefaultImageWidth(imageUrl: string): number {
  // SVG images typically scale well
  if (imageUrl.includes('.svg')) {
    return 1200;
  }
  // Standard OG image width
  return 1200;
}

/**
 * Get default image height for OG images
 */
function getDefaultImageHeight(imageUrl: string): number {
  // SVG images typically scale well
  if (imageUrl.includes('.svg')) {
    return 630;
  }
  // Standard OG image height (1.91:1 ratio)
  return 630;
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
  extractImageMetadata,
  generateCanonicalUrl,
  generateStructuredData,
  generateTwitterImageUrl,
  optimizeKeywords,
  sanitizeDescription,
  validateImageForSocialSharing,
  OG_TEMPLATES,
};
