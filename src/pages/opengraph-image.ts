import type { APIRoute } from 'astro';
import React from 'react';
import satori from 'satori';

export const prerender = false;

// Image metadata
export const alt = 'Piyush Mehta - Software Engineer & Tech Speaker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/svg+xml';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const title = searchParams.get('title') || 'Piyush Mehta';
    const description = searchParams.get('description') || 'Software Engineer & Tech Speaker';
    const type = searchParams.get('type') || 'website';
    const _template = searchParams.get('template') || 'default';
    const date = searchParams.get('date');
    const tags = searchParams.get('tags');
    const theme = searchParams.get('theme') || 'dark';

    // Use web fonts for Cloudflare Pages compatibility

    // Theme configurations
    const themes = {
      dark: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        textPrimary: '#ffffff',
        textSecondary: '#e2e8f0',
        textTertiary: '#94a3b8',
        accent: 'linear-gradient(135deg, #e94560 0%, #f39c12 100%)',
        cardBg: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      light: {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textTertiary: '#64748b',
        accent: 'linear-gradient(135deg, #e94560 0%, #f39c12 100%)',
        cardBg: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(0, 0, 0, 0.1)',
      },
    };

    const currentTheme = themes[theme as keyof typeof themes] || themes.dark;
    const titleFontSize = title.length > 60 ? 38 : title.length > 40 ? 48 : title.length > 20 ? 58 : 68;

    // OpenGraph template optimized for social sharing
    const opengraphTemplate = React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: currentTheme.background,
          fontFamily: 'Inter',
          position: 'relative',
        },
      },
      [
        // Background decorative elements
        React.createElement('div', {
          key: 'bg1',
          style: {
            position: 'absolute',
            top: '40px',
            right: '60px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: theme === 'light' ? 'rgba(233, 69, 96, 0.1)' : 'rgba(233, 69, 96, 0.15)',
          },
        }),
        React.createElement('div', {
          key: 'bg2',
          style: {
            position: 'absolute',
            bottom: '40px',
            left: '60px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: theme === 'light' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(243, 156, 18, 0.2)',
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
              margin: '0 60px',
              textAlign: 'center',
              background: currentTheme.cardBg,
              border: `2px solid ${currentTheme.border}`,
              borderRadius: '20px',
              padding: '50px',
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
                  color: currentTheme.textPrimary,
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
                      fontSize: type === 'article' ? 22 : 26,
                      color: currentTheme.textSecondary,
                      marginBottom: '20px',
                      lineHeight: 1.4,
                      maxWidth: '800px',
                    },
                  },
                  description.length > 120 ? `${description.substring(0, 120)}...` : description
                )
              : null,

            // Blog post metadata
            type === 'article' && date
              ? React.createElement(
                  'div',
                  {
                    key: 'date',
                    style: {
                      fontSize: '18px',
                      color: currentTheme.textTertiary,
                      marginBottom: '15px',
                    },
                  },
                  `Published ${new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
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
                      fontSize: '16px',
                      color: currentTheme.textTertiary,
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
                  background: currentTheme.accent,
                  borderRadius: '30px',
                  padding: '20px 50px',
                  marginTop: '20px',
                },
              },
              [
                React.createElement(
                  'div',
                  {
                    key: 'name',
                    style: {
                      fontSize: '22px',
                      fontWeight: '600',
                      color: 'white',
                    },
                  },
                  'Piyush Mehta'
                ),
                React.createElement(
                  'div',
                  {
                    key: 'role',
                    style: {
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
                  },
                  'Software Engineer & Tech Speaker'
                ),
              ]
            ),
          ].filter(Boolean)
        ),

        // Website URL
        React.createElement(
          'div',
          {
            key: 'url',
            style: {
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              fontSize: '16px',
              color: currentTheme.textTertiary,
              fontWeight: '500',
            },
          },
          'piyushmehta.com'
        ),
      ]
    );

    // Generate SVG with Satori (using web fonts for Cloudflare Pages)
    const svg = await satori(opengraphTemplate, {
      width: size.width,
      height: size.height,
      fonts: [
        {
          name: 'Inter',
          data: await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2').then(res => res.arrayBuffer()),
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2').then(res => res.arrayBuffer()),
          weight: 700,
          style: 'normal',
        },
      ],
    });

    // Return SVG directly for Cloudflare Pages compatibility
    return new Response(svg, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CF-Cache-Status': 'HIT',
      },
    });
  } catch (error) {
    console.error('Error generating OpenGraph image:', error);

    return new Response('Error generating image', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
};