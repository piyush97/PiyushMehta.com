import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';
import React from 'react';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;
  const title = searchParams.get('title') || 'Piyush Mehta';
  const description =
    searchParams.get('description') || 'Software Engineer & Tech Speaker';
  const type = searchParams.get('type') || 'website';
  const date = searchParams.get('date');
  const tags = searchParams.get('tags');

  // Enhanced styling based on content type
  const isArticle = type === 'article';
  const titleFontSize = title.length > 50 ? '42px' : title.length > 30 ? '52px' : '64px';
  const descriptionFontSize = isArticle ? '24px' : '28px';

  try {
    const interRegular = await fetch(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap'
    ).then((res) => res.arrayBuffer());
    const interBold = await fetch(
      'https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap'
    ).then((res) => res.arrayBuffer());

    const image = new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '-.02em',
            fontWeight: 700,
            background:
              'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            position: 'relative',
          },
        },
        [
          // Background decorative elements
          React.createElement('div', {
            key: 'bg1',
            style: {
              position: 'absolute',
              top: '60px',
              right: '80px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(233, 69, 96, 0.15)',
            },
          }),
          React.createElement('div', {
            key: 'bg2',
            style: {
              position: 'absolute',
              bottom: '60px',
              left: '80px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(243, 156, 18, 0.2)',
            },
          }),
          React.createElement('div', {
            key: 'bg3',
            style: {
              position: 'absolute',
              top: '40px',
              left: '40px',
              width: '100px',
              height: '100px',
              borderRadius: '20px',
              background: 'rgba(233, 69, 96, 0.1)',
            },
          }),

          // Main content container
          React.createElement(
            'div',
            {
              key: 'main',
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '1000px',
                margin: '0 80px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '60px',
                backdropFilter: 'blur(10px)',
              },
            },
            [
              // Title
              React.createElement(
                'div',
                {
                  key: 'title',
                  style: {
                    fontSize: titleFontSize,
                    fontWeight: 'bold',
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    lineHeight: 1.2,
                    marginBottom: '20px',
                    maxWidth: '900px',
                  },
                },
                title.length > 80 ? `${title.substring(0, 80)}...` : title
              ),

              // Description
              description
                ? React.createElement(
                    'div',
                    {
                      key: 'description',
                      style: {
                        fontSize: descriptionFontSize,
                        color: '#e2e8f0',
                        marginBottom: '20px',
                        lineHeight: 1.4,
                        maxWidth: '800px',
                      },
                    },
                    description.length > 120
                      ? `${description.substring(0, 120)}...`
                      : description
                  )
                : null,

              // Blog post metadata
              type === 'article' && date
                ? React.createElement(
                    'div',
                    {
                      key: 'date',
                      style: {
                        fontSize: '20px',
                        color: '#94a3b8',
                        marginBottom: '15px',
                      },
                    },
                    `Published ${new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'America/Toronto',
                    })}`
                  )
                : null,

              // Tags
              tags
                ? React.createElement(
                    'div',
                    {
                      key: 'tags',
                      style: {
                        fontSize: '18px',
                        color: '#64748b',
                        marginBottom: '30px',
                      },
                    },
                    tags.split(',').slice(0, 3).join(' • ')
                  )
                : null,

              // Author signature
              React.createElement(
                'div',
                {
                  key: 'author',
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background:
                      'linear-gradient(135deg, #e94560 0%, #f39c12 100%)',
                    borderRadius: '40px',
                    padding: '25px 60px',
                    marginTop: '20px',
                  },
                },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'name',
                      style: {
                        fontSize: '24px',
                        fontWeight: '600',
                        color: 'white',
                        marginBottom: '5px',
                      },
                    },
                    'Piyush Mehta'
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'role',
                      style: {
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.9)',
                      },
                    },
                    'Software Engineer & Tech Speaker'
                  ),
                ]
              ),
            ]
          ),

          // Website URL
          React.createElement(
            'div',
            {
              key: 'url',
              style: {
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                fontSize: '18px',
                color: '#64748b',
                fontWeight: '500',
              },
            },
            'piyushmehta.com'
          ),

          // Subtle pattern overlay
          React.createElement('div', {
            key: 'pattern',
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(233, 69, 96, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 40% 40%, rgba(243, 156, 18, 0.08) 0%, transparent 50%)`,
              pointerEvents: 'none',
            },
          }),
        ]
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: interRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interBold,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );

    return new Response(await image.arrayBuffer(), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
        'Vercel-CDN-Cache-Control': 'max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Fallback to a simple text response if image generation fails
    return new Response('Error generating image', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
};