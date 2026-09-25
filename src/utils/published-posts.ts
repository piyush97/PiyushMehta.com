import publishedPostSlugs from '@/data/published-post-slugs.json';

const PUBLISHED_POST_SLUGS: ReadonlySet<string> = new Set(publishedPostSlugs);

export function isPublishedPostSlug(slug: string): boolean {
  return PUBLISHED_POST_SLUGS.has(slug);
}
