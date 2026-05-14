import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import {
  decodeSocialCardParams,
  getStaticSocialCardData,
  normalizeTemplate,
  normalizeTheme,
  type SocialCardData,
} from '../../utils/social-card';
import { createSocialCardResponse } from '../../utils/social-card-renderer';

export const prerender = false;

const toPostSlug = (id: string) => id.replace(/\/index$/, '').replace(/\.(md|mdx)$/, '');

const calculateReadingTime = (body?: string) => {
  const words = (body || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)).toString();
};

async function getBlogSocialCard(slug: string): Promise<SocialCardData | undefined> {
  const posts = await getCollection('blog');
  const normalizedSlug = slug.toLowerCase();
  const post = posts.find((item) => toPostSlug(item.id).toLowerCase() === normalizedSlug);

  if (!post) {
    return undefined;
  }

  return {
    title: post.data.title,
    description: post.data.description,
    type: 'article',
    template: normalizeTemplate(post.data.ogTemplate || 'blog'),
    theme: normalizeTheme(post.data.ogTheme || 'dark'),
    date: post.data.date,
    tags: post.data.tags,
    readingTime: calculateReadingTime(post.body),
    author: post.data.author || 'Piyush Mehta',
    path: `/blog/${slug}`,
  };
}

export const GET: APIRoute = async ({ params, site }) => {
  const parts = decodeSocialCardParams(params.params);
  const siteUrl = site || new URL('https://piyushmehta.com');
  const domain = siteUrl.hostname;

  if (parts[0] === 'blog' && parts.length > 1) {
    const slug = parts.slice(1).join('/');
    const blogData = await getBlogSocialCard(slug);

    return createSocialCardResponse({
      ...(blogData || getStaticSocialCardData('blog')),
      domain,
    });
  }

  const key = parts.join('/') || 'home';

  return createSocialCardResponse({
    ...getStaticSocialCardData(key),
    domain,
  });
};
