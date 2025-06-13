import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export async function GET(context) {
  try {
    const posts = await getCollection('blog');
    const publishedPosts = posts
      .filter((post) => !post.data.draft)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    // Use context.site or fallback to hardcoded URL
    const site = context.site || new URL('https://piyushmehta.com');
    const siteUrlString = typeof site === 'string' ? site : site.toString();
    
    // Log how many posts were found (for debugging)
    console.log(`Found ${publishedPosts.length} published blog posts for RSS feed`);

    // Generate the RSS feed
    const rssResponse = await rss({
      title: 'Piyush Mehta - Software Engineer & React Developer',
      description: 'Articles and tutorials on React.js, web development, and software engineering by Piyush Mehta.',
      site: site,
      items: publishedPosts.map((post) => {
        // Ensure the slug is properly formatted
        const slug = post.slug.replace(/^\/+|\/+$/g, '');
        const postUrl = `${siteUrlString}/blog/${slug}/`;

        // Extract image for the post if available
        const imageUrl = post.data.image ? 
          (post.data.image.url.startsWith('http') ? post.data.image.url : `${siteUrlString}${post.data.image.url}`) : 
          null;

        // Extract banner for the post if available
        const bannerUrl = post.data.banner ? 
          (post.data.banner.startsWith('http') ? post.data.banner : `${siteUrlString}${post.data.banner}`) :
          null;

        return {
          title: post.data.title,
          pubDate: post.data.date,
          description: post.data.description || `Article by ${post.data.author || 'Piyush Mehta'}`,
          author: `${post.data.author || 'Piyush Mehta'} (hello@piyushmehta.com)`,
          link: postUrl,
          guid: postUrl,
          categories: post.data.tags || [],
          customData: `
            ${imageUrl ? `<media:content url="${imageUrl}" medium="image" />` : ''}
            ${bannerUrl ? `<media:content url="${bannerUrl}" medium="image" />` : ''}
            <dc:creator>${post.data.author || 'Piyush Mehta'}</dc:creator>
            ${post.data.tags ? post.data.tags.map((tag) => `<category>${tag}</category>`).join('') : ''}
          `,
        };
      }),
      customData: `
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Astro v${process.env.npm_package_dependencies__astrojs_core || '4.0.0'}</generator>
        <webMaster>hello@piyushmehta.com (Piyush Mehta)</webMaster>
        <managingEditor>hello@piyushmehta.com (Piyush Mehta)</managingEditor>
        <copyright>Copyright ${new Date().getFullYear()} Piyush Mehta. All rights reserved.</copyright>
        <ttl>60</ttl>
        <image>
          <url>${siteUrlString}/favicon.svg</url>
          <title>Piyush Mehta - Blog</title>
          <link>${siteUrlString}</link>
          <description>Piyush Mehta's blog about software development and technology</description>
        </image>
        <atom:link href="${siteUrlString}/rss.xml" rel="self" type="application/rss+xml" />
      `,
      xmlns: {
        content: 'http://purl.org/rss/1.0/modules/content/',
        dc: 'http://purl.org/dc/elements/1.1/',
        atom: 'http://www.w3.org/2005/Atom',
        media: 'http://search.yahoo.com/mrss/',
      },
      // Explicitly disable the stylesheet to prevent HTML rendering
      stylesheet: false,
    });

    // Manually set the content type to ensure it's served as XML
    return new Response(rssResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Prevent caching issues
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    
    // Return a valid XML response even in case of error
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Piyush Mehta - Software Engineer &amp; React Developer</title>
    <link>https://piyushmehta.com</link>
    <description>Error generating RSS feed</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://piyushmehta.com/rss.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>RSS Feed Generation Error</title>
      <link>https://piyushmehta.com/blog</link>
      <description>There was an error generating the RSS feed. Please check back later or visit the blog directly.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`, { 
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });
  }
}
