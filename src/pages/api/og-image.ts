import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { APIRoute } from 'astro';
import React from 'react';
import satori from 'satori';
import sharp from 'sharp';

export const prerender = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const title = searchParams.get('title') || 'Piyush Mehta';
    const description = searchParams.get('description') || 'Software Engineer & Tech Speaker';
    const type = searchParams.get('type') || 'website';
    const template = searchParams.get('template') || 'default';
    const date = searchParams.get('date');
    const tags = searchParams.get('tags');
    const theme = searchParams.get('theme') || 'dark';

    // Enhanced styling based on content type and template
    const isArticle = type === 'article';
    const titleFontSize = title.length > 60 ? 38 : title.length > 40 ? 48 : title.length > 20 ? 58 : 68;
    const descriptionFontSize = isArticle ? 22 : 26;

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
      retro: {
        background: 'linear-gradient(135deg, #2d1b69 0%, #11998e 50%, #38ef7d 100%)',
        textPrimary: '#ffffff',
        textSecondary: '#f0f9ff',
        textTertiary: '#e0f2fe',
        accent: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
        cardBg: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.2)',
      }
    };

    const currentTheme = themes[theme as keyof typeof themes] || themes.dark;

    // Load fonts
    const fontPath = join(process.cwd(), 'src', 'assets', 'fonts');
    
    const interRegular = fs.readFileSync(join(fontPath, 'Inter-Regular.ttf'));
    const interBold = fs.readFileSync(join(fontPath, 'Inter-Bold.ttf'));

    // Default template (enhanced) using React.createElement
    const getDefaultTemplate = () => {
      return React.createElement(
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
            background: currentTheme.background,
            position: 'relative',
            fontFamily: 'Inter',
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
              background: theme === 'light' ? 'rgba(233, 69, 96, 0.1)' : 'rgba(233, 69, 96, 0.15)',
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
              background: theme === 'light' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(243, 156, 18, 0.2)',
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
              background: theme === 'light' ? 'rgba(233, 69, 96, 0.08)' : 'rgba(233, 69, 96, 0.1)',
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
                background: currentTheme.cardBg,
                border: `2px solid ${currentTheme.border}`,
                borderRadius: '20px',
                padding: '60px',
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
                        fontSize: descriptionFontSize,
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
                        fontSize: '20px',
                        color: currentTheme.textTertiary,
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
            ].filter(Boolean)
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
                color: currentTheme.textTertiary,
                fontWeight: '500',
              },
            },
            'piyushmehta.com'
          ),
        ]
      );
    };

    // Minimal template
    const getMinimalTemplate = () => {
      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: currentTheme.background,
            fontFamily: 'Inter',
            padding: '80px',
          },
        },
        [
          React.createElement(
            'div',
            {
              key: 'title',
              style: {
                fontSize: titleFontSize,
                fontWeight: 'bold',
                color: currentTheme.textPrimary,
                textAlign: 'center',
                marginBottom: '30px',
                lineHeight: 1.1,
              },
            },
            title
          ),
          description ? React.createElement(
            'div',
            {
              key: 'description',
              style: {
                fontSize: '24px',
                color: currentTheme.textSecondary,
                textAlign: 'center',
                marginBottom: '40px',
                lineHeight: 1.4,
                maxWidth: '800px',
              },
            },
            description
          ) : null,
          React.createElement(
            'div',
            {
              key: 'author',
              style: {
                fontSize: '20px',
                color: currentTheme.textTertiary,
                textAlign: 'center',
              },
            },
            'Piyush Mehta • piyushmehta.com'
          ),
        ].filter(Boolean)
      );
    };

    // Tech template with code-like styling
    const getTechTemplate = () => {
      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            height: '100%',
            width: '100%',
            background: '#0a0e27',
            fontFamily: 'Inter',
            position: 'relative',
          },
        },
        [
          // Terminal-like header
          React.createElement(
            'div',
            {
              key: 'header',
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '60px',
                background: '#1a1f3a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 30px',
                borderBottom: '2px solid #2d3748',
              },
            },
            [
              React.createElement('div', {
                key: 'dots',
                style: {
                  display: 'flex',
                  gap: '8px',
                },
              }, [
                React.createElement('div', { key: 'red', style: { width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' } }),
                React.createElement('div', { key: 'yellow', style: { width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' } }),
                React.createElement('div', { key: 'green', style: { width: '12px', height: '12px', borderRadius: '50%', background: '#27ca3f' } }),
              ]),
              React.createElement('div', {
                key: 'title-bar',
                style: {
                  marginLeft: '20px',
                  color: '#718096',
                  fontSize: '14px',
                },
              }, 'piyush-mehta.ts'),
            ]
          ),

          // Main content area
          React.createElement(
            'div',
            {
              key: 'content',
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px 80px',
                paddingTop: '120px',
                height: '100%',
              },
            },
            [
              React.createElement('div', {
                key: 'line1',
                style: { color: '#66d9ef', fontSize: '18px', marginBottom: '10px' },
              }, 'const developer = {'),
              
              React.createElement('div', {
                key: 'line2',
                style: { color: '#a6e22e', fontSize: titleFontSize, marginLeft: '40px', marginBottom: '20px', fontWeight: 'bold' },
              }, `name: "${title.length > 50 ? title.substring(0, 50) + '...' : title}",`),
              
              description ? React.createElement('div', {
                key: 'line3',
                style: { color: '#e6db74', fontSize: '24px', marginLeft: '40px', marginBottom: '20px' },
              }, `description: "${description.length > 60 ? description.substring(0, 60) + '...' : description}",`) : null,
              
              type === 'article' && date ? React.createElement('div', {
                key: 'line4',
                style: { color: '#ae81ff', fontSize: '20px', marginLeft: '40px', marginBottom: '20px' },
              }, `published: "${new Date(date).toISOString().split('T')[0]}",`) : null,
              
              tags ? React.createElement('div', {
                key: 'line5',
                style: { color: '#fd971f', fontSize: '18px', marginLeft: '40px', marginBottom: '20px' },
              }, `tags: [${tags.split(',').slice(0, 3).map(tag => `"${tag.trim()}"`).join(', ')}],`) : null,
              
              React.createElement('div', {
                key: 'line6',
                style: { color: '#66d9ef', fontSize: '18px' },
              }, '};'),
            ].filter(Boolean)
          ),
          
          React.createElement('div', {
            key: 'footer',
            style: {
              position: 'absolute',
              bottom: '40px',
              right: '40px',
              color: '#718096',
              fontSize: '16px',
            },
          }, 'piyushmehta.com'),
        ]
      );
    };

    // Blog template with reading stats
    const getBlogTemplate = () => {
      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            height: '100%',
            width: '100%',
            background: currentTheme.background,
            fontFamily: 'Inter',
            padding: '60px',
          },
        },
        [
          React.createElement(
            'div',
            {
              key: 'left',
              style: {
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingRight: '60px',
              },
            },
            [
              type === 'article' ? React.createElement('div', {
                key: 'badge',
                style: {
                  display: 'inline-block',
                  background: currentTheme.accent,
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '30px',
                  width: 'fit-content',
                },
              }, 'Blog Post') : null,
              
              React.createElement('div', {
                key: 'title',
                style: {
                  fontSize: titleFontSize,
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  lineHeight: 1.2,
                  marginBottom: '20px',
                },
              }, title),
              
              description ? React.createElement('div', {
                key: 'description',
                style: {
                  fontSize: '22px',
                  color: currentTheme.textSecondary,
                  lineHeight: 1.5,
                  marginBottom: '30px',
                },
              }, description) : null,
              
              React.createElement(
                'div',
                {
                  key: 'meta',
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    color: currentTheme.textTertiary,
                    fontSize: '18px',
                  },
                },
                [
                  'By Piyush Mehta',
                  date ? new Date(date).toLocaleDateString() : null,
                  tags ? tags.split(',')[0] : null,
                ].filter(Boolean).join(' • ')
              ),
            ].filter(Boolean)
          ),
          
          React.createElement(
            'div',
            {
              key: 'right',
              style: {
                width: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
            React.createElement(
              'div',
              {
                style: {
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: currentTheme.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '80px',
                  fontWeight: 'bold',
                },
              },
              'PM'
            )
          ),
        ]
      );
    };

    // Template selection
    const getTemplate = () => {
      switch (template) {
        case 'minimal':
          return getMinimalTemplate();
        case 'tech':
          return getTechTemplate();
        case 'blog':
          return getBlogTemplate();
        default:
          return getDefaultTemplate();
      }
    };

    // Generate SVG with Satori
    const svg = await satori(getTemplate(), {
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
    });

    // Convert SVG to PNG with Sharp
    const png = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    return new Response(png, {
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