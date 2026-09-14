export const prerender = true;

export function GET(context) {
  const sitemapUrl = new URL('/sitemap.xml', context.site || 'https://piyushmehta.com');
  return new Response(
    `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /*.tmp
Disallow: /*.bak
Disallow: /*.log

Sitemap: ${sitemapUrl}
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
