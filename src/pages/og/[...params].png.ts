import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import {
  normalizeTemplate,
  normalizeTheme,
  STATIC_SOCIAL_PAGES,
  type SocialCardData,
} from '../../utils/social-card';
import { createSocialCardResponse } from '../../utils/social-card-renderer';

export const prerender = true;

const toPostSlug = (id: string) => id.replace(/\/index$/, '').replace(/\.(md|mdx)$/, '');

const calculateReadingTime = (body?: string) => {
  const words = (body || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)).toString();
};

export const getStaticPaths = (async () => {
  const posts = await getCollection('blog');
  const staticPages = Object.entries(STATIC_SOCIAL_PAGES).map(([key, card]) => ({
    params: { params: key },
    props: { card },
  }));
  const blogPages = posts.map((post) => {
    const slug = toPostSlug(post.id);
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
      path: `/blog/${slug}`,
    };

    return {
      params: { params: `blog/${slug}` },
      props: { card },
    };
  });

  return [...staticPages, ...blogPages];
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const card = props.card as SocialCardData;
  const domain = (site || new URL('https://piyushmehta.com')).hostname;

  return createSocialCardResponse({ ...card, domain });
};
