import { getCollection } from 'astro:content';
import { generateCanonicalUrl } from '../utils/og-generator';
import { toPostSlug } from '../utils/social-card-manifest';
import { escapeXml } from '../utils/xml';

export const prerender = true;

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const site = context.site?.toString() || 'https://piyushmehta.com';
  const staticPages = [
    '/',
    '/about',
    '/blog',
    '/projects',
    '/contact-me',
    '/services',
    '/react-developer',
    '/resume',
    '/videos',
    '/uses',
  ];

  // Request/build time is not evidence of an editorial change. Omit unknown dates.
  const entries = [
    ...staticPages.map((pathname) => ({ url: generateCanonicalUrl(pathname, site) })),
    ...posts.map((post) => ({
      url: generateCanonicalUrl(`/blog/${toPostSlug(post.id)}`, site),
      lastmod: (post.data.updatedDate || post.data.date).toISOString(),
    })),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(({ url, lastmod }) => `  <url><loc>${escapeXml(url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
