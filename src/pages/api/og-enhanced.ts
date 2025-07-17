import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute } from 'astro';
import React from "react";
import satori from "satori";

export const prerender = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced template configurations with modern design patterns
const DESIGN_TEMPLATES = {
  modern: {
    name: "Modern Glass",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryColor: "#ffffff",
    secondaryColor: "#e0e7ff",
    accentColor: "#fbbf24",
    cardBg: "rgba(255, 255, 255, 0.15)",
    shadowColor: "rgba(0, 0, 0, 0.2)",
  },
  tech: {
    name: "Tech Professional",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    primaryColor: "#ffffff",
    secondaryColor: "#e2e8f0",
    accentColor: "#e94560",
    cardBg: "rgba(255, 255, 255, 0.05)",
    shadowColor: "rgba(233, 69, 96, 0.3)",
  },
  cyber: {
    name: "Cyberpunk Neon",
    gradient: "linear-gradient(135deg, #0c0c0c 0%, #1a0033 50%, #000000 100%)",
    primaryColor: "#00ff9f",
    secondaryColor: "#ff006e",
    accentColor: "#8338ec",
    cardBg: "rgba(131, 56, 236, 0.1)",
    shadowColor: "rgba(0, 255, 159, 0.3)",
  },
  minimal: {
    name: "Clean Minimal",
    gradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    primaryColor: "#1e293b",
    secondaryColor: "#475569",
    accentColor: "#3b82f6",
    cardBg: "rgba(255, 255, 255, 0.8)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
  },
  terminal: {
    name: "Developer Terminal",
    gradient: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
    primaryColor: "#a6e22e",
    secondaryColor: "#66d9ef",
    accentColor: "#f92672",
    cardBg: "rgba(26, 31, 58, 0.8)",
    shadowColor: "rgba(249, 38, 114, 0.2)",
  },
  gradient: {
    name: "Gradient Design",
    gradient: "linear-gradient(135deg, #2d1b69 0%, #11998e 50%, #38ef7d 100%)",
    primaryColor: "#ffffff",
    secondaryColor: "#f0f9ff",
    accentColor: "#ff6b6b",
    cardBg: "rgba(255, 255, 255, 0.1)",
    shadowColor: "rgba(0, 0, 0, 0.3)",
  },
  professional: {
    name: "Professional",
    gradient: "linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)",
    primaryColor: "#ffffff",
    secondaryColor: "#e2e8f0",
    accentColor: "#3b82f6",
    cardBg: "rgba(255, 255, 255, 0.12)",
    shadowColor: "rgba(59, 130, 246, 0.3)",
  },
  dark: {
    name: "Dark Theme",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    primaryColor: "#ffffff",
    secondaryColor: "#cbd5e1",
    accentColor: "#06b6d4",
    cardBg: "rgba(255, 255, 255, 0.08)",
    shadowColor: "rgba(6, 182, 212, 0.3)",
  },
  blog: {
    name: "Blog Article",
    gradient: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
    primaryColor: "#ffffff",
    secondaryColor: "#e2e8f0",
    accentColor: "#10b981",
    cardBg: "rgba(255, 255, 255, 0.1)",
    shadowColor: "rgba(16, 185, 129, 0.3)",
  },
} as const;

export const GET: APIRoute = async ({ url, request, site }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const siteUrl = site || new URL('https://piyushmehta.com');
    const siteDomain = siteUrl.hostname;
    
    // Extract parameters
    const title = searchParams.get('title') || 'Piyush Mehta';
    const description = searchParams.get('description') || 'Software Engineer & Tech Speaker';
    const template = (searchParams.get('template') || 'modern') as keyof typeof DESIGN_TEMPLATES;
    const type = searchParams.get('type') || 'website';
    const date = searchParams.get('date');
    const tags = searchParams.get('tags')?.split(',') || [];
    const readingTime = searchParams.get('readingTime');
    const author = searchParams.get('author') || 'Piyush Mehta';
    const showLogo = searchParams.get('showLogo') !== 'false';
    const showBadge = searchParams.get('showBadge') !== 'false';

    const theme = DESIGN_TEMPLATES[template] || DESIGN_TEMPLATES.modern;
    
    // Generate cache key for this request
    const cacheKey = Buffer.from(JSON.stringify({
      title,
      description,
      template,
      type,
      date,
      tags: tags.join(','),
      readingTime,
      author,
      showLogo,
      showBadge,
    })).toString('base64').slice(0, 16);

    // Check for conditional requests
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch && ifNoneMatch === cacheKey) {
      return new Response(null, { status: 304 });
    }
    
    // Dynamic sizing
    const titleSize = title.length > 60 ? 36 : title.length > 40 ? 44 : title.length > 20 ? 52 : 60;
    const descriptionSize = description.length > 100 ? 20 : 24;

    // Load fonts from local files
    const fontPath = join(process.cwd(), "InterVariable.ttf");
    const interRegular = fs.readFileSync(fontPath);
    const interBold = interRegular; // Use same font for bold

    // Create enhanced template using React.createElement
    const getEnhancedTemplate = () => {
      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: theme.gradient,
            fontFamily: "Inter",
            position: "relative",
            textAlign: "center",
            padding: "80px",
          },
        },
        [
          // Background decorative elements
          React.createElement("div", {
            key: "bg-container",
            style: { position: "absolute", inset: 0, overflow: "hidden" },
          }, [
            React.createElement("div", {
              key: "bg1",
              style: {
                position: "absolute",
                top: "-100px",
                right: "-100px",
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                background: theme.accentColor,
                opacity: 0.1,
                filter: "blur(60px)",
              },
            }),
            React.createElement("div", {
              key: "bg2",
              style: {
                position: "absolute",
                bottom: "-120px",
                left: "-120px",
                width: "400px",
                height: "400px",
                borderRadius: "50%",
                background: theme.secondaryColor,
                opacity: 0.08,
                filter: "blur(80px)",
              },
            }),
          ]),

          // Main content card
          React.createElement(
            "div",
            {
              key: "main-card",
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: theme.cardBg,
                borderRadius: "24px",
                padding: "60px",
                border: `1px solid ${theme.accentColor}30`,
                backdropFilter: "blur(20px)",
                boxShadow: `0 20px 40px ${theme.shadowColor}`,
                maxWidth: "900px",
                position: "relative",
                zIndex: 2,
              },
            },
            [
              // Logo
              showLogo ? React.createElement(
                "div",
                {
                  key: "logo",
                  style: {
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "30px",
                    background: theme.cardBg,
                    padding: "12px 24px",
                    borderRadius: "25px",
                    border: `1px solid ${theme.accentColor}30`,
                    backdropFilter: "blur(10px)",
                  },
                },
                [
                  React.createElement(
                    "div",
                    {
                      key: "logo-circle",
                      style: {
                        width: "40px",
                        height: "40px",
                        background: theme.accentColor,
                        borderRadius: "50%",
                        marginRight: "15px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "white",
                        boxShadow: `0 4px 20px ${theme.shadowColor}`,
                      },
                    },
                    "PM"
                  ),
                  React.createElement(
                    "span",
                    {
                      key: "logo-text",
                      style: {
                        color: theme.primaryColor,
                        fontSize: "18px",
                        fontWeight: "600",
                      },
                    },
                    author
                  ),
                ]
              ) : null,

              // Badge
              showBadge ? React.createElement(
                "div",
                {
                  key: "badge",
                  style: {
                    background: theme.accentColor,
                    color: "white",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "20px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    boxShadow: `0 4px 20px ${theme.shadowColor}`,
                  },
                },
                type === "article" ? "Blog Post" : 
                type === "project" ? "Project" : "Content"
              ) : null,

              // Title
              React.createElement(
                "h1",
                {
                  key: "title",
                  style: {
                    fontSize: titleSize,
                    fontWeight: "bold",
                    color: theme.primaryColor,
                    lineHeight: 1.1,
                    marginBottom: "24px",
                    textShadow: `0 2px 10px ${theme.shadowColor}`,
                  },
                },
                title
              ),

              // Description
              description ? React.createElement(
                "p",
                {
                  key: "description",
                  style: {
                    fontSize: descriptionSize,
                    color: theme.secondaryColor,
                    lineHeight: 1.4,
                    marginBottom: "30px",
                    opacity: 0.9,
                    maxWidth: "700px",
                  },
                },
                description
              ) : null,

              // Tags
              tags.length > 0 ? React.createElement(
                "div",
                {
                  key: "tags",
                  style: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "20px",
                    justifyContent: "center",
                  },
                },
                tags.slice(0, 4).map((tag, index) =>
                  React.createElement(
                    "span",
                    {
                      key: `tag-${index}`,
                      style: {
                        background: theme.cardBg,
                        color: theme.secondaryColor,
                        padding: "6px 16px",
                        borderRadius: "15px",
                        fontSize: "14px",
                        border: `1px solid ${theme.accentColor}40`,
                        backdropFilter: "blur(10px)",
                      },
                    },
                    tag.trim()
                  )
                )
              ) : null,

              // Date
              date ? React.createElement(
                "div",
                {
                  key: "date",
                  style: {
                    color: theme.secondaryColor,
                    fontSize: "16px",
                    opacity: 0.8,
                    marginBottom: "20px",
                  },
                },
                new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              ) : null,

              // Reading time
              readingTime ? React.createElement(
                "div",
                {
                  key: "reading-time",
                  style: {
                    color: theme.accentColor,
                    fontSize: "14px",
                    fontWeight: "600",
                  },
                },
                `${readingTime} min read`
              ) : null,
            ].filter(Boolean)
          ),

          // Website URL
          React.createElement(
            "div",
            {
              key: "url",
              style: {
                position: "absolute",
                bottom: "30px",
                right: "40px",
                color: theme.secondaryColor,
                fontSize: "16px",
                opacity: 0.7,
              },
            },
            siteDomain
          ),
        ]
      );
    };

    // Generate SVG with Satori
    const svg = await satori(getEnhancedTemplate(), {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: interRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal",
        },
      ],
    });

    // Convert SVG to PNG with resvg-js
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 1200,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
        'ETag': cacheKey,
        'Vary': 'User-Agent',
      },
    });
  } catch (error) {
    console.error('Error generating enhanced OG image:', error);
    
    // Return a simple fallback image using satori
    try {
      const fallbackTemplate = React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: "48px",
            fontWeight: "bold",
            textAlign: "center",
            fontFamily: "Inter",
          },
        },
        "OG Image Generation Error"
      );

      const fallbackSvg = await satori(fallbackTemplate, {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: interRegular,
            weight: 400,
            style: "normal",
          },
        ],
      });

      const fallbackResvg = new Resvg(fallbackSvg, {
        fitTo: {
          mode: "width",
          value: 1200,
        },
      });

      const fallbackPngData = fallbackResvg.render();
      const fallbackPngBuffer = fallbackPngData.asPng();

      return new Response(fallbackPngBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (_fallbackError) {
      return new Response('Error generating OG image', { status: 500 });
    }
  }
};