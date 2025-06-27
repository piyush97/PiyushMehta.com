// SEO utility functions for performance optimization and consistency

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
