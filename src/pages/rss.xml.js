import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { generateCanonicalUrl } from '../utils/og-generator';
import { toPostSlug } from '../utils/social-card-manifest';
import { escapeXml } from '../utils/xml';

export const prerender = true;

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const site = context.site?.toString() || 'https://piyushmehta.com';

  // Fail the build on feed errors instead of publishing an error feed.
  return rss({
    title: 'Piyush Mehta - Blog',
    description:
      'Practical guides to software architecture, AI workflows, web platforms, and developer tooling by Piyush Mehta.',
    site,
    items: posts.map((post) => {
      const link = generateCanonicalUrl(`/blog/${toPostSlug(post.id)}`, site);
      const image = post.data.image?.url || post.data.banner;
      // Keep the identifier emitted by the old feed; treat it as an opaque ID,
      // not a navigable URL, so existing subscribers don't receive duplicates.
      const legacyGuid = `${new URL(site).origin}//blog/${toPostSlug(post.id)}/`;
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description || `Article by ${post.data.author}`,
        author: `hello@piyushmehta.com (${post.data.author})`,
        link,
        categories: post.data.tags,
        customData: `<guid isPermaLink="false">${escapeXml(legacyGuid)}</guid><dc:creator>${escapeXml(post.data.author)}</dc:creator>${image ? `<media:content url="${escapeXml(new URL(image, site).toString())}" medium="image" />` : ''}`,
      };
    }),
    customData: `<language>en-us</language><atom:link href="${escapeXml(new URL('/rss.xml', site).toString())}" rel="self" type="application/rss+xml" />`,
    xmlns: {
      dc: 'http://purl.org/dc/elements/1.1/',
      atom: 'http://www.w3.org/2005/Atom',
      media: 'http://search.yahoo.com/mrss/',
    },
    stylesheet: false,
  });
}
