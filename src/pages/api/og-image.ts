import type { APIRoute } from 'astro';

export const prerender = false;

// Helper function to escape HTML entities in text
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper function to truncate text with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Helper function to wrap text into multiple lines
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.slice(0, 3); // Max 3 lines
}

// Get page-specific styling and content
function getPageStyling(type: string, title: string) {
  switch (type) {
    case 'blog':
    case 'article':
      return {
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        accentColor: '#3b82f6',
        icon: '📝',
        category: 'Blog Post'
      };
    case 'project':
      return {
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        accentColor: '#10b981',
        icon: '🚀',
        category: 'Project'
      };
    case 'video':
      return {
        gradient: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #ef4444 100%)',
        accentColor: '#f87171',
        icon: '🎥',
        category: 'Video'
      };
    default:
      // Check title for page type hints
      if (title.toLowerCase().includes('about')) {
        return {
          gradient: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)',
          accentColor: '#c084fc',
          icon: '👋',
          category: 'About'
        };
      } else if (title.toLowerCase().includes('contact')) {
        return {
          gradient: 'linear-gradient(135deg, #166534 0%, #059669 50%, #10b981 100%)',
          accentColor: '#34d399',
          icon: '📬',
          category: 'Contact'
        };
      } else if (title.toLowerCase().includes('uses')) {
        return {
          gradient: 'linear-gradient(135deg, #be185d 0%, #e11d48 50%, #f43f5e 100%)',
          accentColor: '#fb7185',
          icon: '🛠️',
          category: 'Uses'
        };
      }
      return {
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        accentColor: '#e94560',
        icon: '✨',
        category: 'Page'
      };
  }
}

export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;
  const title = searchParams.get('title') || 'Piyush Mehta';
  const description = searchParams.get('description') || 'Software Engineer & Tech Speaker';
  const type = searchParams.get('type') || 'website';
  const date = searchParams.get('date');
  const tags = searchParams.get('tags');
  const author = searchParams.get('author') || 'Piyush Mehta';
  const readTime = searchParams.get('readTime');

  // Get page-specific styling
  const styling = getPageStyling(type, title);
  
  // Process text content
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const titleLines = wrapText(title, 45);
  const descriptionLines = wrapText(description, 80);
  
  // Calculate font sizes based on content length
  const titleFontSize = titleLines.length > 1 ? 
    (titleLines[0].length > 30 ? '38' : '48') : 
    (title.length > 30 ? '42' : '56');
  
  // Create tag elements if provided
  const tagElements = tags ? tags.split(',').slice(0, 4).map((tag, index) => {
    const x = 300 + (index * 140);
    return `<rect x="${x - 10}" y="450" width="${Math.min(tag.trim().length * 8 + 20, 120)}" height="30" rx="15" fill="rgba(255,255,255,0.1)" stroke="${styling.accentColor}" stroke-width="1"/>
    <text x="${x}" y="470" fill="${styling.accentColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="500">${escapeHtml(tag.trim())}</text>`;
  }).join('') : '';

  const svgImage = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          ${styling.gradient.match(/linear-gradient\([^)]+\)/)?.[0]?.replace('linear-gradient(135deg, ', '').replace(')', '').split(', ').map((stop, index, arr) => {
            const percentage = (index / (arr.length - 1)) * 100;
            return `<stop offset="${percentage}%" style="stop-color:${stop.split(' ')[0]};stop-opacity:1" />`;
          }).join('') || `<stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />`}
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Decorative elements -->
      <circle cx="1040" cy="120" r="60" fill="rgba(255,255,255,0.05)" opacity="0.8"/>
      <circle cx="160" cy="510" r="40" fill="${styling.accentColor}" opacity="0.2"/>
      <rect x="40" y="40" width="100" height="100" rx="20" fill="${styling.accentColor}" opacity="0.1"/>
      <circle cx="1100" cy="500" r="30" fill="rgba(255,255,255,0.08)"/>
      
      <!-- Main content container -->
      <rect x="80" y="120" width="1040" height="390" rx="25" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      
      <!-- Category badge -->
      <rect x="100" y="140" width="${styling.category.length * 12 + 40}" height="32" rx="16" fill="${styling.accentColor}" opacity="0.2"/>
      <text x="120" y="160" fill="${styling.accentColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="600">
        ${styling.icon} ${styling.category.toUpperCase()}
      </text>
      
      <!-- Title -->
      ${titleLines.map((line, index) => `
        <text x="600" y="${220 + (index * 55)}" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="${titleFontSize}" font-weight="bold">
          ${escapeHtml(line)}
        </text>
      `).join('')}
      
      <!-- Description -->
      ${descriptionLines.slice(0, 2).map((line, index) => `
        <text x="600" y="${titleLines.length > 1 ? 330 + (index * 25) : 300 + (index * 25)}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-size="20">
          ${escapeHtml(line)}
        </text>
      `).join('')}
      
      <!-- Date and read time (for articles) -->
      ${type === 'blog' || type === 'article' ? `
        <text x="600" y="${titleLines.length > 1 ? 400 : 370}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="16">
          ${date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}${readTime ? ` • ${readTime}` : ''}
        </text>
      ` : ''}
      
      <!-- Tags -->
      ${tagElements}
      
      <!-- Author info -->
      <rect x="450" y="540" width="300" height="50" rx="25" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <circle cx="475" cy="565" r="15" fill="${styling.accentColor}" opacity="0.3"/>
      <text x="500" y="570" fill="white" font-family="system-ui, sans-serif" font-size="16" font-weight="500">
        ${escapeHtml(author)} • piyushmehta.com
      </text>
      
      <!-- Subtle pattern overlay -->
      <defs>
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/>
        </pattern>
      </defs>
      <rect width="1200" height="630" fill="url(#dots)" opacity="0.3"/>
    </svg>
  `;

  return new Response(svgImage, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
