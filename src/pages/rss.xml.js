import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import mdxRenderer from '@astrojs/mdx/server.js';
import reactRenderer from '@astrojs/react/server.js';
import rss from '@astrojs/rss';
import { generateCanonicalUrl } from '../utils/og-generator';
import { toPostSlug } from '../utils/social-card-manifest';
import { escapeXml } from '../utils/xml';

export const prerender = true;

const SKIP_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function absoluteUrl(value, base) {
  const url = value.trim();
  if (!url || SKIP_URL.test(url)) return value;
  try {
    return new URL(url, base).toString();
  } catch {
    return value;
  }
}

// Feed readers don't run scripts or apply page CSS, and relative URLs resolve
// against the feed, not the post.
function toFeedHtml(html, base) {
  // Repeat until stable so nested fragments like <scr<script></script>ipt> can't survive.
  let stripped = html;
  let previous;
  do {
    previous = stripped;
    stripped = stripped.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  } while (stripped !== previous);
  return stripped
    .replace(/<\/?astro-island\b[^>]*>/gi, '')
    .replace(/(\s(?:src|href|poster)=)(["'])(.*?)\2/gi, (_, attr, quote, value) => {
      return `${attr}${quote}${absoluteUrl(value, base)}${quote}`;
    })
    .replace(/(\ssrcset=)(["'])(.*?)\2/gi, (_, attr, quote, value) => {
      const set = value
        .split(',')
        .map((candidate) => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/);
          return [absoluteUrl(url, base), ...descriptor].join(' ');
        })
        .join(', ');
      return `${attr}${quote}${set}${quote}`;
    });
}

async function createPostRenderer() {
  try {
    // loadRenderers() imports server entrypoints with native Node ESM, which can't
    // resolve @astrojs/react's `astro:react:opts` virtual module; import them statically.
    const container = await AstroContainer.create();
    container.addServerRenderer({ name: 'astro:jsx', renderer: mdxRenderer });
    container.addServerRenderer({ name: '@astrojs/react', renderer: reactRenderer });
    return container;
  } catch (error) {
    console.warn('[rss] Container unavailable; feed items fall back to descriptions.', error);
    return null;
  }
}

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const site = context.site?.toString() || 'https://piyushmehta.com';
  const container = await createPostRenderer();

  async function renderPost(post, link) {
    if (!container) return undefined;
    try {
      const { Content } = await render(post);
      return toFeedHtml(await container.renderToString(Content), link);
    } catch (error) {
      console.warn(`[rss] Could not render ${post.id}; using its description.`, error);
      return undefined;
    }
  }

  const contents = [];
  // Render sequentially; astro.config.mjs keeps content rendering sequential.
  for (const post of posts) {
    contents.push(
      await renderPost(post, generateCanonicalUrl(`/blog/${toPostSlug(post.id)}`, site)),
    );
  }

  // Fail the build on feed errors instead of publishing an error feed.
  return rss({
    title: 'Piyush Mehta - Blog',
    description:
      'Practical guides to software architecture, AI workflows, web platforms, and developer tooling by Piyush Mehta.',
    site,
    items: posts.map((post, index) => {
      const link = generateCanonicalUrl(`/blog/${toPostSlug(post.id)}`, site);
      const image = post.data.image?.url || post.data.banner;
      // Keep the identifier emitted by the old feed; treat it as an opaque ID,
      // not a navigable URL, so existing subscribers don't receive duplicates.
      const legacyGuid = `${new URL(site).origin}//blog/${toPostSlug(post.id)}/`;
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description || `Article by ${post.data.author}`,
        content: contents[index] || post.data.description || `Article by ${post.data.author}`,
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
