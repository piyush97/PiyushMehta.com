import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import fs from 'fs';
import { join } from 'path';
import React from 'react';
import satori from 'satori';

export const prerender = false;

export const GET: APIRoute = async ({ url, request }): Promise<Response> => {
  const searchParams = new URL(url).searchParams;
  const title = searchParams.get('title') || 'Piyush Mehta';
  const description = searchParams.get('description') || 'Software Engineer & Tech Speaker';
  const template = searchParams.get('template') || 'modern';

  try {
    // Check if this is a social media crawler
    const userAgent = request.headers.get('user-agent') || '';
    const isSocialCrawler = /facebook|twitter|linkedin|whatsapp|telegram|discord|slack/i.test(
      userAgent
    );

    // For social media crawlers, add extra delay to ensure proper rendering
    if (isSocialCrawler) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Load fonts
    const fontPath = join(process.cwd(), 'InterVariable.ttf');
    const interRegular = fs.readFileSync(fontPath);

    // Template configurations matching website theme
    const getThemeColors = (template: string) => {
      const themes = {
        modern: {
          gradient: 'linear-gradient(135deg, #1f2347 0%, #282e5e 50%, #2e3360 100%)',
          primaryColor: '#f9fafb',
          secondaryColor: '#d1d5db',
          accentColor: '#60a5fa',
          cardBg: 'rgba(40, 46, 94, 0.8)',
          shadowColor: 'rgba(96, 165, 250, 0.3)',
        },
        tech: {
          gradient: 'linear-gradient(135deg, #1a1f3a 0%, #24283b 50%, #2d3748 100%)',
          primaryColor: '#f9fafb',
          secondaryColor: '#e2e8f0',
          accentColor: '#60a5fa',
          cardBg: 'rgba(26, 31, 58, 0.9)',
          shadowColor: 'rgba(96, 165, 250, 0.25)',
        },
        blog: {
          gradient: 'linear-gradient(135deg, #1f2347 0%, #282e5e 50%, #343c7a 100%)',
          primaryColor: '#f9fafb',
          secondaryColor: '#d1d5db',
          accentColor: '#60a5fa',
          cardBg: 'rgba(40, 46, 94, 0.85)',
          shadowColor: 'rgba(96, 165, 250, 0.3)',
        },
        minimal: {
          gradient: 'linear-gradient(135deg, #efeff5 0%, #e6e8f5 50%, #f5f5f5 100%)',
          primaryColor: '#363b65',
          secondaryColor: '#4b547d',
          accentColor: '#b54909',
          cardBg: 'rgba(255, 255, 255, 0.9)',
          shadowColor: 'rgba(181, 73, 9, 0.2)',
        },
      };

      return themes[template as keyof typeof themes] || themes.modern;
    };

    const theme = getThemeColors(template);

    // Dynamic sizing based on content length
    const titleSize = title.length > 60 ? 42 : title.length > 40 ? 48 : title.length > 20 ? 54 : 60;
    const descriptionSize = description.length > 100 ? 20 : 24;

    // Enhanced template with website branding
    const templateElement = React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: theme.gradient,
          fontFamily: 'Inter',
          position: 'relative',
          textAlign: 'center',
          padding: '80px',
        },
      },
      [
        // Background decorative elements
        React.createElement('div', {
          key: 'bg-decoration',
          style: {
            position: 'absolute',
            top: '60px',
            right: '80px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: theme.accentColor,
            opacity: 0.1,
            filter: 'blur(60px)',
          },
        }),

        // Main content card
        React.createElement(
          'div',
          {
            key: 'main-card',
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme.cardBg,
              borderRadius: '24px',
              padding: '60px',
              border: `2px solid ${theme.accentColor}30`,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 20px 40px ${theme.shadowColor}`,
              maxWidth: '900px',
              position: 'relative',
              zIndex: '2',
            },
          },
          [
            // Logo/Branding
            React.createElement(
              'div',
              {
                key: 'logo',
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme.cardBg,
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: `1px solid ${theme.accentColor}30`,
                  backdropFilter: 'blur(10px)',
                  marginBottom: '20px',
                },
              },
              [
                React.createElement(
                  'div',
                  {
                    key: 'logo-circle',
                    style: {
                      width: '40px',
                      height: '40px',
                      background: theme.accentColor,
                      borderRadius: '50%',
                      marginRight: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: `0 4px 20px ${theme.shadowColor}`,
                    },
                  },
                  'PM'
                ),
                React.createElement(
                  'span',
                  {
                    key: 'logo-text',
                    style: {
                      color: theme.primaryColor,
                      fontSize: '18px',
                      fontWeight: '600',
                    },
                  },
                  'Piyush Mehta'
                ),
              ]
            ),

            // Title
            React.createElement(
              'h1',
              {
                key: 'title',
                style: {
                  fontSize: titleSize,
                  fontWeight: 'bold',
                  color: theme.primaryColor,
                  lineHeight: 1.1,
                  marginBottom: '24px',
                  textShadow: `0 2px 10px ${theme.shadowColor}`,
                  textAlign: 'center',
                },
              },
              title
            ),

            // Description
            description
              ? React.createElement(
                  'p',
                  {
                    key: 'description',
                    style: {
                      fontSize: descriptionSize,
                      color: theme.secondaryColor,
                      lineHeight: 1.4,
                      marginBottom: '30px',
                      opacity: 0.9,
                      maxWidth: '700px',
                      textAlign: 'center',
                    },
                  },
                  description
                )
              : null,

            // Website URL
            React.createElement(
              'div',
              {
                key: 'url',
                style: {
                  position: 'absolute',
                  bottom: '30px',
                  right: '40px',
                  color: theme.secondaryColor,
                  fontSize: '16px',
                  opacity: 0.7,
                },
              },
              'piyushmehta.com'
            ),
          ].filter(Boolean)
        ),
      ]
    );

    // Generate SVG with Satori
    const svg = await satori(templateElement, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal',
        },
      ],
    });

    // Convert SVG to PNG with resvg-js
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Different caching strategies for social crawlers vs regular users
    const cacheControl = isSocialCrawler
      ? 'public, max-age=86400, s-maxage=86400' // 24 hours for crawlers
      : 'public, max-age=31536000, immutable'; // 1 year for regular users

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pngBuffer.length.toString(),
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Robots-Tag': 'noindex',
        // Additional headers for social media crawlers
        ...(isSocialCrawler && {
          'X-Crawler-Friendly': 'true',
          Link: `<${url}>; rel="canonical"`,
        }),
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Return a fallback static image for social media crawlers
    try {
      const fallbackImagePath = join(process.cwd(), 'public/images/social.jpg');
      const fallbackImage = fs.readFileSync(fallbackImagePath);

      return new Response(fallbackImage, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': fallbackImage.length.toString(),
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Fallback-Image': 'true',
        },
      });
    } catch (fallbackError) {
      console.error('Fallback image error:', fallbackError);

      // Create a simple fallback SVG image as last resort
      const fallbackSvg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="630" fill="#1f2347"/>
          <text x="600" y="300" text-anchor="middle" fill="#f9fafb" font-family="Arial" font-size="48" font-weight="bold">
            ${title ? title.substring(0, 50) + (title.length > 50 ? '...' : '') : 'Piyush Mehta'}
          </text>
          <text x="600" y="360" text-anchor="middle" fill="#d1d5db" font-family="Arial" font-size="24">
            piyushmehta.com
          </text>
        </svg>
      `;

      const resvg = new Resvg(fallbackSvg);
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      return new Response(new Uint8Array(pngBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': pngBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600', // 1 hour cache for error fallbacks
          'Access-Control-Allow-Origin': '*',
          'X-Emergency-Fallback': 'true',
        },
      });
    }
  }
};
