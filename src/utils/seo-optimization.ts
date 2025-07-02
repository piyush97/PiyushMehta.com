// SEO utility functions for performance optimization and consistency

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
 * Generate consistent OpenGraph image URLs
 * @param params - Parameters for OG image generation
 * @returns Optimized OG image URL
 */
export function generateOgImageUrl(params: {
  title: string;
  description?: string;
  type?: string;
  publishedTime?: Date;
  tags?: string[];
  baseUrl?: string;
}): string {
  const { title, description, type, publishedTime, tags, baseUrl = 'https://piyushmehta.com' } = params;
  
  const searchParams = new URLSearchParams();
  searchParams.set('title', title);
  
  if (description) {
    searchParams.set('description', description);
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

  // Use a simpler URL structure
  return `${baseUrl}/api/og-image?${searchParams.toString()}`;
}

/**
 * Generate structured data for different page types
 * @param params - Parameters for structured data generation
 * @returns Structured data object
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
    image
  } = params;

  const baseSchema = {
    '@context': 'https://schema.org',
    headline: title,
    description: description,
    author: {
      '@type': 'Person',
      name: author,
      url: 'https://piyushmehta.com',
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
        url: 'https://piyushmehta.com',
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
 * Optimize and deduplicate keywords
 * @param keywords - Array of keywords to optimize
 * @param tags - Array of tags to include
 * @returns Optimized keyword string
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
  const uniqueKeywords = Array.from(
    new Set(allKeywords.map(k => k.toLowerCase()))
  ).map(k => {
    // Find the original casing from the first occurrence
    return allKeywords.find(original => original.toLowerCase() === k) || k;
  });

  return uniqueKeywords.join(', ');
}

/**
 * Generate canonical URL with proper trailing slash handling
 * @param path - The page path
 * @param baseUrl - Base URL (default: https://piyushmehta.com)
 * @returns Canonical URL
 */
export function generateCanonicalUrl(path: string = '', baseUrl: string = 'https://piyushmehta.com'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;
  
  // Ensure consistent trailing slash handling
  if (cleanPath !== '/' && url.endsWith('/')) {
    return url.slice(0, -1);
  }
  
  return url;
}

/**
 * Validate and sanitize meta description
 * @param description - Raw description
 * @param maxLength - Maximum length (default: 160)
 * @returns Sanitized description
 */
export function sanitizeDescription(description: string, maxLength: number = 160): string {
  // Remove HTML tags and extra whitespace
  const cleaned = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
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
 * Resolve image URL to absolute URL
 * @param imageUrl - Relative or absolute image URL
 * @param baseUrl - Base URL for the site
 * @returns Absolute image URL
 */
export function resolveImageUrl(imageUrl: string, baseUrl: string = 'https://piyushmehta.com'): string {
  if (!imageUrl) return '';
  
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
 * @param imageUrl - Image URL
 * @returns HTTPS version of the URL
 */
export function generateSecureImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // Already HTTPS
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Convert HTTP to HTTPS
  if (imageUrl.startsWith('http://')) {
    return imageUrl.replace('http://', 'https://');
  }
  
  // Relative URL - resolve to HTTPS
  return resolveImageUrl(imageUrl, 'https://piyushmehta.com');
}

/**
 * Extract image metadata for OG Protocol compliance with @vercel/og fallback
 * @param image - Image object from content
 * @param baseUrl - Base URL for the site
 * @param fallbackParams - Parameters for generating fallback OG image
 * @returns Complete image metadata
 */
export function extractImageMetadata(
  image: { url: string; alt?: string; width?: number; height?: number; type?: string } | string | null,
  baseUrl: string = 'https://piyushmehta.com',
  fallbackParams?: {
    title: string;
    description?: string;
    type?: string;
    publishedTime?: Date;
    tags?: string[];
  }
): ImageMetadata {
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
  
  // Fallback to @vercel/og generated image
  if (fallbackParams) {
    const ogImageUrl = generateOgImageUrl({ ...fallbackParams, baseUrl });
    return {
      url: ogImageUrl,
      secureUrl: ogImageUrl, // @vercel/og always serves HTTPS
      type: 'image/png', // @vercel/og generates PNG images
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
 * Get image MIME type from URL extension
 * @param imageUrl - Image URL
 * @returns MIME type
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
      return 'image/svg+xml';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Get default image width for OG images
 * @param imageUrl - Image URL
 * @returns Default width in pixels
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
 * @param imageUrl - Image URL
 * @returns Default height in pixels
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
 * Validate image for social sharing
 * @param imageMetadata - Image metadata
 * @returns Validation result
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
