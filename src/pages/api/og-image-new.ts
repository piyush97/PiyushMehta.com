import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;
  const title = searchParams.get('title') || 'Piyush Mehta';
  const description =
    searchParams.get('description') || 'Software Engineer & Tech Speaker';
  const type = searchParams.get('type') || 'website';
  const date = searchParams.get('date');
  const tags = searchParams.get('tags');

  // For now, return a simple SVG-based OG image
  // This can be enhanced later with proper image generation
  const svgImage = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <circle cx="1040" cy="120" r="60" fill="rgba(233,69,96,0.15)"/>
      <circle cx="160" cy="510" r="40" fill="rgba(243,156,18,0.2)"/>
      <rect x="40" y="40" width="100" height="100" rx="20" fill="rgba(233,69,96,0.1)"/>
      
      <rect x="100" y="150" width="1000" height="330" rx="20" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      
      <text x="600" y="250" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="${title.length > 40 ? '42' : '56'}" font-weight="bold">
        ${title}
      </text>
      
      <text x="600" y="320" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-size="24">
        ${description}
      </text>
      
      ${date ? `<text x="600" y="370" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="18">${date}</text>` : ''}
      
      ${tags ? `<text x="600" y="420" text-anchor="middle" fill="rgba(233,69,96,0.8)" font-family="system-ui, sans-serif" font-size="16">${tags}</text>` : ''}
      
      <text x="600" y="550" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="16">
        piyushmehta.com
      </text>
    </svg>
  `;

  return new Response(svgImage, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
