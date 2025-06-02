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

  // Create SVG with dynamic content
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#e94560;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f39c12;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGradient)"/>
      
      <!-- Decorative elements -->
      <circle cx="1100" cy="100" r="80" fill="#e94560" opacity="0.1"/>
      <circle cx="100" cy="530" r="60" fill="#f39c12" opacity="0.15"/>
      <rect x="950" y="400" width="200" height="200" rx="20" fill="#f39c12" opacity="0.05"/>
      <rect x="50" y="50" width="150" height="150" rx="15" fill="#e94560" opacity="0.08"/>
      
      <!-- Content area -->
      <rect x="80" y="80" width="1040" height="470" rx="20" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      
      <!-- Title -->
      <text x="600" y="200" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${title.length > 40 ? '42' : '52'}" font-weight="bold" fill="white">
        ${title.length > 50 ? title.substring(0, 50) + '...' : title}
      </text>
      
      <!-- Description -->
      ${
        description
          ? `
      <text x="600" y="260" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#e2e8f0">
        ${description.length > 100 ? description.substring(0, 100) + '...' : description}
      </text>
      `
          : ''
      }
      
      <!-- Blog post metadata -->
      ${
        type === 'article' && date
          ? `
      <text x="600" y="310" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8">
        Published ${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </text>
      `
          : ''
      }
      
      <!-- Tags -->
      ${
        tags
          ? `
      <text x="600" y="350" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748b">
        ${tags.split(',').slice(0, 3).join(' • ')}
      </text>
      `
          : ''
      }
      
      <!-- Author signature -->
      <rect x="400" y="420" width="400" height="80" rx="40" fill="url(#accentGradient)" opacity="0.9"/>
      <text x="600" y="450" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="white">
        Piyush Mehta
      </text>
      <text x="600" y="475" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.9)">
        Software Engineer & Tech Speaker
      </text>
      
      <!-- Website URL -->
      <text x="1120" y="600" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748b">
        piyushmehta.com
      </text>
      
      <!-- Tech pattern background -->
      <defs>
        <pattern id="techPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/>
        </pattern>
      </defs>
      <rect width="1200" height="630" fill="url(#techPattern)" opacity="0.3"/>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
