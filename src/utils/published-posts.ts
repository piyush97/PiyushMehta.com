import { slug as githubSlug } from 'github-slugger';
import publishedPostSlugs from '../data/published-post-slugs.json';

const PUBLISHED_POST_SLUGS: ReadonlySet<string> = new Set(publishedPostSlugs);

/** Match Astro's content-loader slug space for incoming runtime identifiers. */
export const toPublishedPostSlug = (value: string): string => githubSlug(value.trim());

export function isPublishedPostSlug(slug: string): boolean {
  return PUBLISHED_POST_SLUGS.has(toPublishedPostSlug(slug));
}
