// seo-helpers.js - Utility functions for SEO optimization

/**
 * Generates optimized metadata for pages based on context
 * @param {Object} options - The options for generating metadata
 * @returns {Object} - The metadata object
 */
export const generatePageMetadata = ({
  title,
  description,
  pagePath = '',
  type = 'website',
  image,
  keywords = [],
  publishedTime,
  modifiedTime,
  tags = [],
  author = 'Piyush Mehta',
}) => {
  // Base domain
  const domain = 'https://piyushmehta.com';

  // Default keywords that should appear on all pages
  const defaultKeywords = [
    'Piyush Mehta',
    'React Developer',
    'Software Engineer',
    'Software Engineer in Canada',
    'ReactJS Developer',
    'Canadian Developer',
  ];

  // Combine with page-specific keywords and deduplicate
  const allKeywords = [...new Set([...defaultKeywords, ...keywords, ...tags])];

  // Construct canonical URL
  const canonicalUrl = `${domain}${pagePath}`;

  // Default image if none provided
  const ogImage = image || `${domain}/images/social.jpg`;

  return {
    title,
    description,
    type,
    url: canonicalUrl,
    image: ogImage,
    author,
    publishedTime,
    modifiedTime,
    tags,
    canonical: canonicalUrl,
    keywords: allKeywords,
  };
};

/**
 * Generates common SEO tags for target keywords
 * @param {string} keyword - The primary keyword to target
 * @returns {string[]} - Array of related keywords
 */
export const generateKeywordVariations = (keyword) => {
  const variations = [
    keyword,
    `${keyword} Canada`,
    `${keyword} Toronto`,
    `${keyword} expert`,
    `${keyword} professional`,
    `${keyword} services`,
    `hire ${keyword}`,
    `${keyword} specialist`,
    `best ${keyword}`,
  ];

  return variations;
};

/**
 * Predefined keyword sets for common page types
 */
export const keywordSets = {
  reactDeveloper: [
    'React Developer',
    'ReactJS Developer',
    'React.js Developer',
    'React Engineer',
    'React Frontend Developer',
    'React Application Development',
    'React Web Development',
    'React Developer Canada',
    'React Developer Toronto',
    'Hire React Developer',
    'Custom React Solutions',
    'React Performance Optimization',
  ],

  softwareEngineer: [
    'Software Engineer',
    'Software Developer',
    'Software Engineer in Canada',
    'Software Consultant in Canada',
    'Web Developer',
    'Full Stack Developer',
    'JavaScript Engineer',
    'TypeScript Developer',
    'Node.js Developer',
    'Software Engineer Toronto',
    'Hire Software Engineer',
    'Software Engineering Services',
  ],

  blog: [
    'Web Development Blog',
    'React Development Blog',
    'Software Engineering Blog',
    'React.js Tutorials',
    'JavaScript Articles',
    'Frontend Development Tips',
    'Web Development Resources',
    'React.js Best Practices',
    'Tech Blog',
    'Software Engineering Articles',
    'Web Development Tutorials',
  ],
};

/**
 * Generates a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slug
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncates a description to an SEO-friendly length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 160 characters)
 * @returns {string} - The truncated description
 */
export const truncateDescription = (text, maxLength = 160) => {
  if (text.length <= maxLength) return text;

  // Find the last space before the maxLength
  const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');

  if (lastSpace === -1) return `${text.substring(0, maxLength)}...`;

  return `${text.substring(0, lastSpace)}...`;
};
