/**
 * Utility functions for generating Open Graph meta tags
 */

export interface OGImageOptions {
  title?: string;
  description?: string;
  type?: 'website' | 'article' | 'blog' | 'project' | 'video' | 'about' | 'contact' | 'uses' | 'resume';
  date?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  slug?: string;
}

/**
 * Generate OG image URL for a page
 */
export function getOGImageUrl(options: OGImageOptions = {}, baseUrl = 'https://piyushmehta.com'): string {
  const params = new URLSearchParams();
  
  if (options.title) params.set('title', options.title);
  if (options.description) params.set('description', options.description);
  if (options.type) params.set('type', options.type);
  if (options.date) params.set('date', options.date);
  if (options.tags && options.tags.length > 0) params.set('tags', options.tags.join(', '));
  if (options.author) params.set('author', options.author);
  if (options.readTime) params.set('readTime', options.readTime);

  // Use slug-based URL if available, otherwise use query parameters
  if (options.slug) {
    return `${baseUrl}/api/og/${options.slug}`;
  }
  
  return `${baseUrl}/api/og-image?${params.toString()}`;
}

/**
 * Generate Open Graph meta tags for a page
 */
export function getOGMetaTags(options: OGImageOptions & { 
  url?: string; 
  siteName?: string;
}, baseUrl = 'https://piyushmehta.com') {
  const ogImageUrl = getOGImageUrl(options, baseUrl);
  const siteName = options.siteName || 'Piyush Mehta';
  const title = options.title || 'Piyush Mehta';
  const description = options.description || 'Software Engineer & Tech Speaker';
  const url = options.url || baseUrl;

  return {
    // Open Graph
    'og:title': title,
    'og:description': description,
    'og:image': ogImageUrl,
    'og:url': url,
    'og:type': options.type === 'article' ? 'article' : 'website',
    'og:site_name': siteName,
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': ogImageUrl,
    'twitter:creator': '@piyush97',
    'twitter:site': '@piyush97',
    
    // Article specific (if applicable)
    ...(options.type === 'article' && options.date ? {
      'article:published_time': options.date,
      'article:author': options.author || 'Piyush Mehta',
      ...(options.tags ? { 'article:tag': options.tags } : {})
    } : {})
  };
}

/**
 * Common page configurations for OG images
 */
export const pageConfigs = {
  home: {
    title: 'Piyush Mehta',
    description: 'Senior Software Engineer, Tech Speaker & Open Source Contributor',
    type: 'website' as const,
    slug: 'home'
  },
  about: {
    title: 'About Piyush Mehta',
    description: 'Learn more about my journey as a software engineer, speaker, and open source contributor',
    type: 'about' as const,
    slug: 'about'
  },
  contact: {
    title: "Let's Connect!",
    description: 'Get in touch for speaking engagements, collaborations, or just to say hello',
    type: 'contact' as const,
    slug: 'contact-me'
  },
  projects: {
    title: 'My Projects',
    description: 'Explore my portfolio of web applications, open source contributions, and side projects',
    type: 'project' as const,
    slug: 'projects'
  },
  blog: {
    title: 'Tech Blog',
    description: 'Articles about software development, web technologies, and engineering best practices',
    type: 'blog' as const,
    slug: 'blog'
  },
  videos: {
    title: 'Tech Videos',
    description: 'Watch my talks, tutorials, and technical content on YouTube and other platforms',
    type: 'video' as const,
    slug: 'videos'
  },
  uses: {
    title: 'Tools & Setup',
    description: 'Discover the tools, software, and hardware I use for development and productivity',
    type: 'uses' as const,
    slug: 'uses'
  },
  resume: {
    title: 'Resume - Piyush Mehta',
    description: 'Senior Software Engineer with expertise in React, Node.js, and cloud technologies',
    type: 'resume' as const,
    slug: 'resume'
  }
} as const;

/**
 * Helper to get OG config for a specific page
 */
export function getPageOGConfig(page: keyof typeof pageConfigs) {
  return pageConfigs[page];
}
