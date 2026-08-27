import { getCollection } from 'astro:content';
import {
  hashSocialCardVersion,
  normalizeTemplate,
  normalizeTheme,
  STATIC_SOCIAL_PAGES,
  type SocialCardData,
} from './social-card';

export interface SocialCardManifestEntry {
  key: string;
  card: SocialCardData;
  version: string;
}

export type SocialCardManifest = ReadonlyMap<string, SocialCardManifestEntry>;

export const toPostSlug = (id: string): string =>
  id.replace(/\/index$/, '').replace(/\.(md|mdx)$/, '');

const calculateReadingTime = (body = ''): string => {
  const words = body.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)).toString();
};

let cached: Promise<SocialCardManifest> | undefined;

async function buildManifest(): Promise<SocialCardManifest> {
  const entries = new Map<string, SocialCardManifestEntry>();

  for (const [key, card] of Object.entries(STATIC_SOCIAL_PAGES)) {
    entries.set(key, { key, card, version: hashSocialCardVersion(key, JSON.stringify(card)) });
  }

  const posts = await getCollection('blog', ({ data }) => !data.draft);

  for (const post of posts) {
    const key = `blog/${toPostSlug(post.id)}`;
    const card: SocialCardData = {
      title: post.data.title,
      description: post.data.description,
      type: 'article',
      template: normalizeTemplate(post.data.ogTemplate || 'blog'),
      theme: normalizeTheme(post.data.ogTheme || 'dark'),
      date: post.data.date,
      tags: post.data.tags,
      readingTime: calculateReadingTime(post.body),
      author: post.data.author || 'Piyush Mehta',
      path: `/${key}`,
    };
    // post.digest changes whenever the post's frontmatter or body changes, so editing a
    // title/description/tag/theme automatically rotates this card's ?v= and forces a re-fetch.
    const seed = post.digest ?? JSON.stringify(card);
    entries.set(key, { key, card, version: hashSocialCardVersion(key, seed) });
  }

  if (!entries.has('default')) {
    throw new Error('Social card manifest is missing the "default" entry — /og/default.png would 404.');
  }

  return entries;
}

/**
 * Single source of truth for every social card that will be prerendered at `/og/**.png`.
 * `src/pages/og/[...params].png.ts` builds getStaticPaths from this; `SEO.astro` resolves every
 * page's og:image through it. Because both sides read the same manifest, "the SEO layer emitted
 * a card URL" and "the route prerendered that file" are structurally the same fact.
 *
 * Memoized per build (Astro's prerender step runs each page once, but this can be imported by
 * many pages) — astro:content's getCollection is itself cached, so this mostly avoids redoing
 * the manifest assembly work.
 */
export function getSocialCardManifest(): Promise<SocialCardManifest> {
  cached ??= buildManifest();
  return cached;
}
