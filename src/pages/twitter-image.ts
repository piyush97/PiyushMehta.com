import fs from 'fs';
import { join } from 'path';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import React from 'react';
import satori from 'satori';

export const prerender = false;

// Twitter image metadata - optimized for Twitter Cards
export const alt = 'Piyush Mehta - Software Engineer & Tech Speaker';
export const size = { width: 1200, height: 630 }; // Twitter summary_large_image size
export const contentType = 'image/png';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const title = searchParams.get('title') || 'Piyush Mehta';
    const description = searchParams.get('description') || 'Software Engineer & Tech Speaker';
    const type = searchParams.get('type') || 'website';
    const _template = searchParams.get('template') || 'twitter';
    const date = searchParams.get('date');
    const tags = searchParams.get('tags');
    const theme = searchParams.get('theme') || 'dark';

    // Load font
    const fontPath = join(process.cwd(), 'InterVariable.ttf');
    const interFont = fs.readFileSync(fontPath);

    // Twitter-optimized theme (more vibrant for social engagement)
    const themes = {
      dark: {
        background: 'linear-gradient(135deg, #1da1f2 0%, #14171a 50%, #657786 100%)',
        textPrimary: '#ffffff',
        textSecondary: '#e1e8ed',
        textTertiary: '#8899a6',
        accent: 'linear-gradient(135deg, #1da1f2 0%, #00d084 100%)',
        cardBg: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.15)',
      },
      light: {
        background: 'linear-gradient(135deg, #ffffff 0%, #f7f9fa 50%, #e1e8ed 100%)',
        textPrimary: '#14171a',
        textSecondary: '#536471',
        textTertiary: '#657786',
        accent: 'linear-gradient(135deg, #1da1f2 0%, #00d084 100%)',
        cardBg: 'rgba(255, 255, 255, 0.9)',
        border: 'rgba(20, 23, 26, 0.1)',
      },
    };

    const currentTheme = themes[theme as keyof typeof themes] || themes.dark;
    const titleFontSize = title.length > 60 ? 36 : title.length > 40 ? 46 : title.length > 20 ? 56 : 66;

    // Twitter-optimized template with better readability
    const twitterTemplate = React.createElement(
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
        // Twitter-style background pattern
        React.createElement('div', {
          key: 'twitter-bg',
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            opacity: '0.1',
            background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40z'/%3E%3C/g%3E%3C/svg%3E")`,
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
              border: `3px solid ${currentTheme.border}`,
              borderRadius: '24px',
              padding: '50px',
              backdropFilter: 'blur(10px)',
            },
          },
          [
            // Twitter-style header
            React.createElement(
              'div',
              {
                key: 'twitter-header',
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '30px',
                  fontSize: '18px',
                  color: currentTheme.textTertiary,
                },
              },
              React.createElement(
                'div',
                {
                  style: {
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentTheme.accent,
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  },
                },
                'PM'
              ),
              '@piyushmehta'
            ),

            // Title
            React.createElement(
              'div',
              {
                key: 'title',
                style: {
                  fontSize: titleFontSize,
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  lineHeight: 1.1,
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
                      fontSize: type === 'article' ? 20 : 24,
                      color: currentTheme.textSecondary,
                      marginBottom: '20px',
                      lineHeight: 1.4,
                      maxWidth: '800px',
                    },
                  },
                  description.length > 120 ? `${description.substring(0, 120)}...` : description
                )
              : null,

            // Metadata
            React.createElement(
              'div',
              {
                key: 'metadata',
                style: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '20px',
                  marginTop: '20px',
                  fontSize: '16px',
                  color: currentTheme.textTertiary,
                },
              },
              [
                type === 'article' && date
                  ? React.createElement(
                      'div',
                      { key: 'date' },
                      `📅 ${new Date(date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    )
                  : null,
                tags
                  ? React.createElement(
                      'div',
                      { key: 'tags' },
                      `🏷️ ${tags.split(',').slice(0, 2).join(', ')}`
                    )
                  : null,
                React.createElement('div', { key: 'domain' }, '🌐 piyushmehta.com'),
              ].filter(Boolean)
            ),
          ].filter(Boolean)
        ),

        // Twitter logo/branding
        React.createElement(
          'div',
          {
            key: 'branding',
            style: {
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              background: currentTheme.accent,
              borderRadius: '12px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
            },
          },
          'Follow on X/Twitter'
        ),
      ]
    );

    // Generate SVG with Satori
    const svg = await satori(twitterTemplate, {
      width: size.width,
      height: size.height,
      fonts: [
        {
          name: 'Inter',
          data: interFont,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interFont,
          weight: 700,
          style: 'normal',
        },
      ],
    });

    // Convert SVG to PNG with resvg-js
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: size.width,
      },
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
        'Vercel-CDN-Cache-Control': 'max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating Twitter image:', error);

    return new Response('Error generating image', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
};