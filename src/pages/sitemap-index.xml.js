export const prerender = true;

export function GET() {
  return new Response(null, {
    status: 301,
    headers: {
      Location: '/sitemap.xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
