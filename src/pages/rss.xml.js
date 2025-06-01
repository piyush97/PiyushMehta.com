import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  try {
    const posts = await getCollection('blog');
    const publishedPosts = posts
      .filter((post) => !post.data.draft)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    const siteUrl = context.site || 'https://piyushmehta.com';

    return rss({
      title: 'Piyush Mehta - Blog',
      description:
        'Thoughts on software development, technology, and the art of building great products. Articles about React, Node.js, DevOps, and modern web development.',
      site: siteUrl,
      items: publishedPosts.map((post) => {
        const postUrl = `${siteUrl}/blog/${post.slug}/`;

        return {
          title: post.data.title,
          pubDate: post.data.date,
          description: post.data.description || '',
          author: `${post.data.author || 'Piyush Mehta'} (hello@piyushmehta.com)`,
          link: postUrl,
          guid: postUrl,
          categories: post.data.tags || [],
          customData: `
            <content:encoded><![CDATA[${post.body}]]></content:encoded>
            <dc:creator>${post.data.author || 'Piyush Mehta'}</dc:creator>
            ${post.data.tags ? post.data.tags.map((tag) => `<category>${tag}</category>`).join('') : ''}
          `,
        };
      }),
      stylesheet: '/rss-styles.xsl',
      customData: `
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Astro v${process.env.npm_package_dependencies__astrojs_core || '4.0.0'}</generator>
        <webMaster>hello@piyushmehta.com (Piyush Mehta)</webMaster>
        <managingEditor>hello@piyushmehta.com (Piyush Mehta)</managingEditor>
        <copyright>Copyright ${new Date().getFullYear()} Piyush Mehta. All rights reserved.</copyright>
        <ttl>60</ttl>
        <image>
          <url>${siteUrl}/images/social.jpg</url>
          <title>Piyush Mehta - Blog</title>
          <link>${siteUrl}</link>
          <description>Piyush Mehta's blog about software development and technology</description>
        </image>
        <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
      `,
      xmlns: {
        content: 'http://purl.org/rss/1.0/modules/content/',
        dc: 'http://purl.org/dc/elements/1.1/',
        atom: 'http://www.w3.org/2005/Atom',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
