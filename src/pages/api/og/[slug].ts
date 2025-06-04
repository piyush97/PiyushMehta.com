import type { APIRoute } from 'astro';

export const prerender = false;

// Import the main OG image generator
async function generateOGImage(params: Record<string, string>) {
  const ogImageUrl = new URL('/api/og-image', 'http://localhost');
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) ogImageUrl.searchParams.set(key, value);
  });

  const response = await fetch(ogImageUrl.toString());
  return response.text();
}

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug as string;
  
  try {
    let ogParams: Record<string, string> = {};

    // Handle different page types
    if (slug === 'home' || slug === 'index') {
      ogParams = {
        title: 'Piyush Mehta',
        description: 'Senior Software Engineer, Tech Speaker & Open Source Contributor',
        type: 'website',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'about') {
      ogParams = {
        title: 'About Piyush Mehta',
        description: 'Learn more about my journey as a software engineer, speaker, and open source contributor',
        type: 'about',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'contact-me') {
      ogParams = {
        title: "Let's Connect!",
        description: 'Get in touch for speaking engagements, collaborations, or just to say hello',
        type: 'contact',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'projects') {
      ogParams = {
        title: 'My Projects',
        description: 'Explore my portfolio of web applications, open source contributions, and side projects',
        type: 'project',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'blog') {
      ogParams = {
        title: 'Tech Blog',
        description: 'Articles about software development, web technologies, and engineering best practices',
        type: 'blog',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'videos') {
      ogParams = {
        title: 'Tech Videos',
        description: 'Watch my talks, tutorials, and technical content on YouTube and other platforms',
        type: 'video',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'uses') {
      ogParams = {
        title: 'Tools & Setup',
        description: 'Discover the tools, software, and hardware I use for development and productivity',
        type: 'uses',
        author: 'Piyush Mehta'
      };
    }
    else if (slug === 'resume') {
      ogParams = {
        title: 'Resume - Piyush Mehta',
        description: 'Senior Software Engineer with expertise in React, Node.js, and cloud technologies',
        type: 'resume',
        author: 'Piyush Mehta'
      };
    }
    else {
      // For any other slug, create a basic page OG image
      // You can enhance this by adding a mapping or database lookup
      const pageTitle = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      ogParams = {
        title: pageTitle,
        description: `Learn more about ${pageTitle.toLowerCase()} on piyushmehta.com`,
        type: 'website',
        author: 'Piyush Mehta'
      };
    }

    // Generate the OG image
    const svgContent = await generateOGImage(ogParams);

    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });

  } catch (error) {
    console.error('Error generating OG image for slug:', slug, error);
    
    // Return a simple fallback
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#1a1a2e"/>
        <text x="600" y="315" text-anchor="middle" fill="white" font-family="system-ui" font-size="48">
          Piyush Mehta
        </text>
      </svg>
    `;
    
    return new Response(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
};
