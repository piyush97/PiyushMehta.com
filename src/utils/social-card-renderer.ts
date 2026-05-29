import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import { join } from 'path';
import React from 'react';
import satori from 'satori';
import {
  cleanText,
  formatSocialDate,
  SOCIAL_CARD_CONTENT_TYPE,
  SOCIAL_CARD_SIZE,
  type SocialCardData,
  truncateText,
} from './social-card';

const CACHE_HEADERS = {
  'Content-Type': SOCIAL_CARD_CONTENT_TYPE,
  'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  'CDN-Cache-Control': 'max-age=31536000',
  'Vercel-CDN-Cache-Control': 'max-age=31536000',
  'Access-Control-Allow-Origin': '*',
  'X-Robots-Tag': 'noindex',
} as const;

type ThemeConfig = {
  bg: string;
  panel: string;
  panelSoft: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentText: string;
  stripe: string;
};

let interFont: Buffer | undefined;

function getInterFont(): Buffer {
  if (!interFont) {
    interFont = fs.readFileSync(join(process.cwd(), 'InterVariable.ttf'));
  }

  return interFont;
}

function getTheme(theme?: SocialCardData['theme']): ThemeConfig {
  if (theme === 'light') {
    return {
      bg: '#f6f3ea',
      panel: '#fffaf0',
      panelSoft: '#efe7d8',
      border: '#d8cbb8',
      text: '#141827',
      muted: '#4b5871',
      faint: '#7a715f',
      accent: '#8d3d1f',
      accentText: '#fffaf0',
      stripe: '#24304c',
    };
  }

  if (theme === 'retro') {
    return {
      bg: '#121827',
      panel: '#1f2937',
      panelSoft: '#102b34',
      border: '#2f5f63',
      text: '#ecfeff',
      muted: '#b7eadc',
      faint: '#79a7a0',
      accent: '#38ef7d',
      accentText: '#07120d',
      stripe: '#ffcc68',
    };
  }

  return {
    bg: '#171a2f',
    panel: '#222640',
    panelSoft: '#1f2347',
    border: '#343a5f',
    text: '#f6f7ff',
    muted: '#c8cbe8',
    faint: '#8f96ba',
    accent: '#ffcc68',
    accentText: '#11131f',
    stripe: '#8d3d1f',
  };
}

function titleSize(title: string, template?: SocialCardData['template']): number {
  const base = title.length > 96 ? 46 : title.length > 72 ? 52 : title.length > 48 ? 60 : 68;

  return template === 'tech' ? Math.max(42, base - 4) : base;
}

function descriptionSize(description: string): number {
  return description.length > 130 ? 25 : description.length > 80 ? 28 : 31;
}

function templateLabel(
  type?: SocialCardData['type'],
  template?: SocialCardData['template']
): string {
  if (type === 'article') {
    return 'Article';
  }

  if (type === 'project') {
    return 'Case Study';
  }

  if (template === 'tech') {
    return 'Engineering';
  }

  return 'Portfolio';
}

function createGridLines(theme: ThemeConfig) {
  const vertical = Array.from({ length: 10 }, (_, index) =>
    React.createElement('div', {
      key: `v-${index}`,
      style: {
        position: 'absolute',
        left: `${90 + index * 105}px`,
        top: '0px',
        width: '1px',
        height: '630px',
        background: theme.border,
        opacity: index % 2 === 0 ? 0.3 : 0.18,
      },
    })
  );

  const horizontal = Array.from({ length: 5 }, (_, index) =>
    React.createElement('div', {
      key: `h-${index}`,
      style: {
        position: 'absolute',
        left: '0px',
        top: `${92 + index * 104}px`,
        width: '1200px',
        height: '1px',
        background: theme.border,
        opacity: index % 2 === 0 ? 0.24 : 0.14,
      },
    })
  );

  return [...vertical, ...horizontal];
}

function createTags(tags: string[], theme: ThemeConfig) {
  return tags.slice(0, 4).map((tag, index) =>
    React.createElement(
      'div',
      {
        key: `${tag}-${index}`,
        style: {
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${theme.border}`,
          background: theme.panelSoft,
          color: theme.muted,
          fontSize: 22,
          fontWeight: 720,
          lineHeight: 1,
          padding: '11px 16px',
        },
      },
      truncateText(tag, 22)
    )
  );
}

function createMetaItems(data: SocialCardData, theme: ThemeConfig) {
  const items = [
    formatSocialDate(data.date),
    data.readingTime ? `${data.readingTime} min read` : undefined,
    data.domain || 'piyushmehta.com',
  ].filter(Boolean);

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        gap: '18px',
        flexWrap: 'wrap',
        color: theme.faint,
        fontSize: 22,
        fontWeight: 650,
        lineHeight: 1,
      },
    },
    items.map((item, index) =>
      React.createElement(
        'div',
        {
          key: `${item}-${index}`,
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        item
      )
    )
  );
}

function createRightPanel(data: SocialCardData, theme: ThemeConfig) {
  const skills =
    data.template === 'blog'
      ? ['Systems', 'Tradeoffs', 'Field Notes']
      : data.template === 'tech'
        ? ['TypeScript', 'AI Workflows', 'Platform']
        : ['Reliable Web', 'Architecture', 'Canada'];

  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        top: '56px',
        right: '56px',
        width: '294px',
        height: '518px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: `1px solid ${theme.border}`,
        background: theme.panel,
        padding: '28px',
      },
    },
    [
      React.createElement(
        'div',
        {
          key: 'monogram',
          style: {
            display: 'flex',
            width: '116px',
            height: '116px',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.accent,
            color: theme.accentText,
            fontSize: 42,
            fontWeight: 900,
            lineHeight: 1,
          },
        },
        'PM'
      ),
      React.createElement(
        'div',
        {
          key: 'skills',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          },
        },
        skills.map((skill) =>
          React.createElement(
            'div',
            {
              key: skill,
              style: {
                display: 'flex',
                borderTop: `1px solid ${theme.border}`,
                paddingTop: '12px',
                color: theme.muted,
                fontSize: 20,
                fontWeight: 720,
              },
            },
            skill
          )
        )
      ),
      React.createElement(
        'div',
        {
          key: 'domain',
          style: {
            display: 'flex',
            color: theme.faint,
            fontSize: 20,
            fontWeight: 700,
          },
        },
        data.domain || 'piyushmehta.com'
      ),
    ]
  );
}

export function createSocialCardElement(input: SocialCardData) {
  const data: SocialCardData = {
    author: 'Piyush Mehta',
    type: 'website',
    template: 'professional',
    theme: 'dark',
    ...input,
    title: cleanText(input.title) || 'Piyush Mehta',
    description: cleanText(input.description),
    tags:
      input.tags?.flatMap((tag) => {
        const c = cleanText(tag);
        return c ? [c] : [];
      }) || [],
  };
  const theme = getTheme(data.theme);
  const title = truncateText(data.title, data.type === 'article' ? 92 : 82);
  const description = truncateText(data.description, data.type === 'article' ? 150 : 136);
  const label = templateLabel(data.type, data.template);

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        position: 'relative',
        width: `${SOCIAL_CARD_SIZE.width}px`,
        height: `${SOCIAL_CARD_SIZE.height}px`,
        overflow: 'hidden',
        background: theme.bg,
        fontFamily: 'Inter',
      },
    },
    [
      React.createElement('div', {
        key: 'bg-gradient',
        style: {
          position: 'absolute',
          inset: '0px',
          background:
            data.theme === 'light'
              ? `linear-gradient(135deg, ${theme.bg} 0%, ${theme.panel} 58%, #eadfce 100%)`
              : `linear-gradient(135deg, ${theme.bg} 0%, ${theme.panelSoft} 58%, #101423 100%)`,
        },
      }),
      ...createGridLines(theme),
      React.createElement('div', {
        key: 'top-stripe',
        style: {
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '1200px',
          height: '12px',
          background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.stripe} 72%, ${theme.panel} 100%)`,
        },
      }),
      React.createElement('div', {
        key: 'left-rail',
        style: {
          position: 'absolute',
          top: '72px',
          left: '56px',
          width: '10px',
          height: '486px',
          background: theme.accent,
        },
      }),
      React.createElement(
        'div',
        {
          key: 'content',
          style: {
            position: 'absolute',
            left: '96px',
            top: '64px',
            width: '720px',
            height: '504px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        },
        [
          React.createElement(
            'div',
            {
              key: 'top',
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
              },
            },
            [
              React.createElement(
                'div',
                {
                  key: 'brand',
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  },
                },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'badge',
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: theme.accent,
                        color: theme.accentText,
                        fontSize: 18,
                        fontWeight: 850,
                        lineHeight: 1,
                        padding: '10px 15px',
                      },
                    },
                    label
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'name',
                      style: {
                        display: 'flex',
                        color: theme.muted,
                        fontSize: 23,
                        fontWeight: 760,
                        lineHeight: 1,
                      },
                    },
                    data.author || 'Piyush Mehta'
                  ),
                ]
              ),
              React.createElement(
                'div',
                {
                  key: 'title',
                  style: {
                    display: 'flex',
                    color: theme.text,
                    fontSize: titleSize(title, data.template),
                    fontWeight: 900,
                    lineHeight: 1.03,
                    letterSpacing: 0,
                    maxWidth: '720px',
                  },
                },
                title
              ),
              description
                ? React.createElement(
                    'div',
                    {
                      key: 'description',
                      style: {
                        display: 'flex',
                        color: theme.muted,
                        fontSize: descriptionSize(description),
                        fontWeight: 540,
                        lineHeight: 1.35,
                        letterSpacing: 0,
                        maxWidth: '690px',
                      },
                    },
                    description
                  )
                : null,
            ].filter(Boolean)
          ),
          React.createElement(
            'div',
            {
              key: 'bottom',
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              },
            },
            [
              data.tags?.length
                ? React.createElement(
                    'div',
                    {
                      key: 'tags',
                      style: {
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                      },
                    },
                    createTags(data.tags, theme)
                  )
                : null,
              createMetaItems(data, theme),
            ].filter(Boolean)
          ),
        ]
      ),
      createRightPanel(data, theme),
    ]
  );
}

export async function renderSocialCardPng(data: SocialCardData): Promise<Buffer> {
  const svg = await satori(createSocialCardElement(data), {
    width: SOCIAL_CARD_SIZE.width,
    height: SOCIAL_CARD_SIZE.height,
    fonts: [
      {
        name: 'Inter',
        data: getInterFont(),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: getInterFont(),
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: SOCIAL_CARD_SIZE.width,
    },
  });

  return Buffer.from(resvg.render().asPng());
}

export async function createSocialCardResponse(data: SocialCardData): Promise<Response> {
  try {
    const png = await renderSocialCardPng(data);

    return new Response(new Uint8Array(png), {
      headers: {
        ...CACHE_HEADERS,
        'Content-Length': png.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating social card:', error);

    const fallbackPng = renderFallbackPng(data.title);

    return new Response(new Uint8Array(fallbackPng), {
      status: 200,
      headers: {
        ...CACHE_HEADERS,
        'Content-Length': fallbackPng.byteLength.toString(),
        'X-Fallback-Image': 'true',
      },
    });
  }
}

function renderFallbackPng(title?: string): Buffer {
  const safeTitle = escapeXml(truncateText(title || 'Piyush Mehta', 58));
  const svg = `
    <svg width="${SOCIAL_CARD_SIZE.width}" height="${SOCIAL_CARD_SIZE.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#171a2f"/>
      <rect x="0" y="0" width="1200" height="12" fill="#ffcc68"/>
      <text x="96" y="300" fill="#f6f7ff" font-family="Arial" font-size="56" font-weight="700">${safeTitle}</text>
      <text x="96" y="368" fill="#c8cbe8" font-family="Arial" font-size="28">Piyush Mehta - Senior Software Engineer</text>
      <text x="96" y="520" fill="#8f96ba" font-family="Arial" font-size="22">piyushmehta.com</text>
    </svg>
  `;

  return Buffer.from(new Resvg(svg).render().asPng());
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
