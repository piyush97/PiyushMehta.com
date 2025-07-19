// 🎨 Dynamic OG Image Generation API
// Handles all OG image requests with caching and performance optimization

import type { APIRoute } from 'astro';
import generateCachedOGImage, { getCacheStats } from '../../utils/og-cache';
import { type OGImageParams, generateOGImage } from '../../utils/og-generator';

// 🎯 Performance & Caching Configuration
const CACHE_DURATION = 60 * 60 * 24 * 7; // 7 days
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 200;

// 📊 Usage Analytics (simple in-memory counter)
let generationCount = 0;
const templateUsage = new Map<string, number>();

/**
 * 🛡️ Input Validation & Sanitization
 */
function validateAndSanitizeInput(searchParams: URLSearchParams): OGImageParams {
  const title = searchParams.get('title')?.trim();
  if (!title) {
    throw new Error('Title is required');
  }

  const description = searchParams.get('description')?.trim();
  const type = searchParams.get('type')?.trim();
  const dateString = searchParams.get('date')?.trim();
  const tagsString = searchParams.get('tags')?.trim();
  const template = searchParams.get('template')?.trim() as OGImageParams['template'];
  const theme = searchParams.get('theme')?.trim() as OGImageParams['theme'];
  const isTwitter = searchParams.get('twitter') === 'true';
  
  // Ignore cache-busting parameter (used by dev tools)
  // const cacheBuster = searchParams.get('_cb'); // ignored

  // Parse and validate date
  let publishedTime: Date | undefined;
  if (dateString) {
    try {
      publishedTime = new Date(dateString);
      if (isNaN(publishedTime.getTime())) {
        publishedTime = undefined;
      }
    } catch {
      publishedTime = undefined;
    }
  }

  // Parse tags
  const tags = tagsString
    ? tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 5) // Limit to 5 tags
    : [];

  // Determine page type
  let pageType: OGImageParams['pageType'] = 'website';
  if (type === 'article' || tags.some(tag => ['blog', 'post', 'article'].includes(tag.toLowerCase()))) {
    pageType = 'article';
  } else if (tags.some(tag => ['project', 'github', 'app'].includes(tag.toLowerCase()))) {
    pageType = 'project';
  } else if (title.toLowerCase().includes('about')) {
    pageType = 'about';
  } else if (title.toLowerCase().includes('contact')) {
    pageType = 'contact';
  } else if (title.toLowerCase().includes('service')) {
    pageType = 'services';
  }

  // Intelligent theme selection based on content
  let finalTheme = theme || 'dark';
  if (!theme) {
    if (tags.some(tag => ['cyber', 'hacker', 'security'].includes(tag.toLowerCase()))) {
      finalTheme = 'neon';
    } else if (tags.some(tag => ['corporate', 'business', 'enterprise'].includes(tag.toLowerCase()))) {
      finalTheme = 'corporate';
    } else if (tags.some(tag => ['design', 'ui', 'ux', 'creative'].includes(tag.toLowerCase()))) {
      finalTheme = 'warm';
    } else if (tags.some(tag => ['ocean', 'blue', 'water', 'cloud'].includes(tag.toLowerCase()))) {
      finalTheme = 'ocean';
    }
  }

  // Template selection with Twitter optimization
  let finalTemplate = template || 'default';
  if (isTwitter && !template) {
    finalTemplate = 'minimal'; // Twitter prefers cleaner designs
  }

  return {
    title: title.substring(0, MAX_TITLE_LENGTH),
    description: description?.substring(0, MAX_DESCRIPTION_LENGTH),
    author: 'Piyush Mehta',
    publishedTime,
    tags,
    template: finalTemplate,
    theme: finalTheme,
    pageType,
    showLogo: true,
    showBadge: true,
    // Calculate reading time based on description length (rough estimate)
    readingTime: description ? Math.ceil(description.split(' ').length / 200) : undefined,
  };
}

/**
 * 🎨 Generate Cache Key for Optimization
 */
function generateCacheKey(params: OGImageParams): string {
  const keyParts = [
    params.title,
    params.description || '',
    params.template || 'default',
    params.theme || 'dark',
    params.pageType || 'website',
    params.publishedTime?.toISOString() || '',
    params.tags?.join(',') || '',
  ];
  
  return Buffer.from(keyParts.join('|')).toString('base64').replace(/[/+=]/g, '');
}

/**
 * 📊 Track Template Usage Analytics
 */
function trackUsage(template: string) {
  generationCount++;
  const currentCount = templateUsage.get(template) || 0;
  templateUsage.set(template, currentCount + 1);
  
  // Log analytics every 100 generations (development only)
  if (import.meta.env.DEV && generationCount % 100 === 0) {
    console.log('🎨 OG Image Analytics:', {
      totalGenerated: generationCount,
      templateUsage: Object.fromEntries(templateUsage),
    });
  }
}

/**
 * 🚀 Main API Route Handler
 */
export const GET: APIRoute = async ({ url }) => {
  const startTime = Date.now();
  
  try {
    // Parse and validate input parameters
    const params = validateAndSanitizeInput(url.searchParams);
    
    // Generate cache key
    const cacheKey = generateCacheKey(params);
    
    // Track usage analytics
    trackUsage(params.template || 'default');
    
    // Generate the OG image (with caching)
    const imageBuffer = await generateCachedOGImage(params);
    
    const generationTime = Date.now() - startTime;
    
    // Development logging
    if (import.meta.env.DEV) {
      console.log(`🎨 Generated OG image: "${params.title}" (${params.template}/${params.theme}) in ${generationTime}ms`);
    }
    
    // Return the image with appropriate headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': `public, max-age=${CACHE_DURATION}, immutable`,
        'Content-Length': imageBuffer.length.toString(),
        'X-Generation-Time': `${generationTime}ms`,
        'X-Template': params.template || 'default',
        'X-Theme': params.theme || 'dark',
        'X-Cache-Key': cacheKey,
        // CORS headers for external usage
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ Error generating OG image:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestUrl: url.toString(),
      searchParams: Object.fromEntries(url.searchParams),
    });
    
    // Return a simple fallback image with actual title (not "Error")
    const errorTitle = url.searchParams.get('title') || 'Image Generation Failed';
    // Sanitize the title for SVG
    const sanitizedTitle = errorTitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)"/>
        <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${sanitizedTitle.substring(0, 50)}
        </text>
        <text x="600" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#8892b0" text-anchor="middle" dominant-baseline="middle">
          Piyush Mehta - Software Engineer
        </text>
        <text x="600" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#4a5568" text-anchor="middle" dominant-baseline="middle">
          Generated Image • piyushmehta.com
        </text>
        <text x="600" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#ef4444" text-anchor="middle" dominant-baseline="middle">
          Fallback Image - Check console for errors
        </text>
      </svg>
    `;
    
    return new Response(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Shorter cache for errors
        'X-Error': 'fallback-image',
      },
    });
  }
};

/**
 * 📊 Analytics & Cache Stats Endpoint (Development Only)
 */
export const POST: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV) {
    return new Response('Not available in production', { status: 404 });
  }
  
  const action = url.searchParams.get('action');
  
  if (action === 'stats') {
    return new Response(JSON.stringify({
      generation: {
        totalGenerated: generationCount,
        templateUsage: Object.fromEntries(templateUsage),
      },
      cache: getCacheStats(),
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  return new Response(JSON.stringify({
    totalGenerated: generationCount,
    templateUsage: Object.fromEntries(templateUsage),
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};