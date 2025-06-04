export async function GET(context) {
  const siteUrl = context.site || 'https://piyushmehta.com';

  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/rss.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block access to admin areas (if any)
Disallow: /admin/
Disallow: /api/
Disallow: /.well-known/

# Block access to temporary files
Disallow: /*.tmp
Disallow: /*.bak
Disallow: /*.log

# Allow common assets
Allow: /images/
Allow: /assets/
Allow: /css/
Allow: /js/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp
Allow: /*.ico

# Host information
Host: ${siteUrl}`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  });
}
