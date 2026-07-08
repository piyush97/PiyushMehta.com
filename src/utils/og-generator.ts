/**
 * Enhanced OG Image Generator Utility
 * Inspired by Syntax FM's approach with modern enhancements
 */

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
