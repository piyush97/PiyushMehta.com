import { getCollection } from 'astro:content';

export async function GET(context) {
  try {
    const posts = await getCollection('blog');
    const publishedPosts = posts.filter((post) => !post.data.draft);

    const siteUrl = context.site || 'https://piyushmehta.com';

    // Static pages
    const staticPages = [
      '',
      '/about/',
      '/blog/',
      '/projects/',
      '/contact-me/',
      '/videos/',
      '/workshops/',
      '/uses/',
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' || page === '/blog/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : page === '/blog/' ? '0.9' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
${publishedPosts
  .map(
    (post) => `  <url>
    <loc>${siteUrl}/blog/${post.slug}/</loc>
    <lastmod>${post.data.date.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
