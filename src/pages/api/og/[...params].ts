import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";
import * as Sentry from "@sentry/node";
import type { APIRoute } from "astro";
import React from "react";
import satori from "satori";

export const prerender = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced template configurations inspired by Syntax FM
const TEMPLATE_CONFIGS = {
  syntax: {
    name: "Syntax FM Inspired",
    background: "linear-gradient(135deg, #2d1b69 0%, #11998e 50%, #38ef7d 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#f0f9ff",
    accent: "#ff6b6b",
    showCode: true,
  },
  tech: {
    name: "Tech Terminal",
    background: "#0a0e27",
    textPrimary: "#ffffff",
    textSecondary: "#a6e22e",
    accent: "#66d9ef",
    showTerminal: true,
  },
  minimal: {
    name: "Clean Minimal",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#f8fafc",
    accent: "#fbbf24",
    showMinimal: true,
  },
  podcast: {
    name: "Podcast Style",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#e2e8f0",
    accent: "linear-gradient(135deg, #e94560 0%, #f39c12 100%)",
    showWaveform: true,
  },
  blog: {
    name: "Blog Article",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    textPrimary: "#1e293b",
    textSecondary: "#475569",
    accent: "#3b82f6",
    showReadingTime: true,
  },
  modern: {
    name: "Modern Gradient",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#e0e7ff",
    accent: "#fbbf24",
    showGrid: true,
  },
  neon: {
    name: "Neon Cyber",
    background: "linear-gradient(135deg, #0c0c0c 0%, #1a0033 50%, #000000 100%)",
    textPrimary: "#00ff9f",
    textSecondary: "#ff006e",
    accent: "#8338ec",
    showNeon: true,
  },
  retro: {
    name: "Retro Wave",
    background: "linear-gradient(135deg, #2d1b69 0%, #11998e 50%, #38ef7d 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#f0f9ff",
    accent: "#ff6b6b",
    showRetro: true,
  },
} as const;

export const GET: APIRoute = async ({ params, url, site }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const pathParams = params.params?.split('/') || [];
    const siteUrl = site || new URL('https://piyushmehta.com');
    const siteDomain = siteUrl.hostname;
    
    // Enhanced parameter extraction (inspired by Syntax FM's URL structure)
    const title = searchParams.get("title") || decodeURIComponent(pathParams[0] || "Piyush Mehta");
    const template = (searchParams.get("template") || pathParams[1] || "syntax") as keyof typeof TEMPLATE_CONFIGS;
    const _theme = searchParams.get("theme") || "dark";
    const description = searchParams.get("description") || "Software Engineer & Tech Speaker";
    const type = searchParams.get("type") || "website";
    const date = searchParams.get("date");
    const tags = searchParams.get("tags");
    const episode = searchParams.get("episode"); // For podcast-style templates
    const _readingTime = searchParams.get("readingTime");
    const language = searchParams.get("lang") || "javascript";

    // Dynamic font sizing based on content length
    const titleFontSize = 
      title.length > 80 ? 32 :
      title.length > 60 ? 38 :
      title.length > 40 ? 48 :
      title.length > 20 ? 58 : 68;

    const config = TEMPLATE_CONFIGS[template] || TEMPLATE_CONFIGS.syntax;

    // Load fonts
    const fontPath = join(process.cwd(), "InterVariable.ttf");
    const interRegular = fs.readFileSync(fontPath);

    // Syntax FM inspired template
    const getSyntaxTemplate = () => {
      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            height: "100%",
            width: "100%",
            background: config.background,
            fontFamily: "Inter",
            position: "relative",
            overflow: "hidden",
          },
        },
        [
          // Animated background elements
          React.createElement("div", {
            key: "bg-circle-1",
            style: {
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "rgba(255, 107, 107, 0.2)",
              filter: "blur(40px)",
            },
          }),
          React.createElement("div", {
            key: "bg-circle-2",
            style: {
              position: "absolute",
              bottom: "-80px",
              left: "-80px",
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              background: "rgba(56, 239, 125, 0.15)",
              filter: "blur(60px)",
            },
          }),
          React.createElement("div", {
            key: "bg-circle-3",
            style: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "rgba(17, 153, 142, 0.1)",
              filter: "blur(80px)",
            },
          }),

          // Main content
          React.createElement(
            "div",
            {
              key: "main",
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                padding: "80px",
                textAlign: "center",
                position: "relative",
                zIndex: 2,
              },
            },
            [
              // Logo/Brand area
              React.createElement(
                "div",
                {
                  key: "brand",
                  style: {
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "40px",
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "15px 30px",
                    borderRadius: "25px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  },
                },
                [
                  React.createElement("div", {
                    key: "logo",
                    style: {
                      width: "40px",
                      height: "40px",
                      background: config.accent,
                      borderRadius: "50%",
                      marginRight: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "white",
                    },
                  }, "PM"),
                  React.createElement(
                    "span",
                    {
                      key: "brand-text",
                      style: {
                        color: config.textPrimary,
                        fontSize: "18px",
                        fontWeight: "600",
                      },
                    },
                    "Piyush Mehta"
                  ),
                ]
              ),

              // Title
              React.createElement(
                "h1",
                {
                  key: "title",
                  style: {
                    fontSize: titleFontSize,
                    fontWeight: "bold",
                    color: config.textPrimary,
                    lineHeight: 1.1,
                    marginBottom: "30px",
                    maxWidth: "1000px",
                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                  },
                },
                title.length > 100 ? `${title.substring(0, 100)}...` : title
              ),

              // Description
              description && React.createElement(
                "p",
                {
                  key: "description",
                  style: {
                    fontSize: "24px",
                    color: config.textSecondary,
                    lineHeight: 1.4,
                    marginBottom: "30px",
                    maxWidth: "800px",
                    opacity: 0.9,
                  },
                },
                description.length > 150 ? `${description.substring(0, 150)}...` : description
              ),

              // Tags/Episode info
              (tags || episode) && React.createElement(
                "div",
                {
                  key: "tags",
                  style: {
                    display: "flex",
                    gap: "15px",
                    marginBottom: "40px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  },
                },
                [
                  episode && React.createElement(
                    "span",
                    {
                      key: "episode",
                      style: {
                        background: config.accent,
                        color: "white",
                        padding: "8px 20px",
                        borderRadius: "20px",
                        fontSize: "16px",
                        fontWeight: "600",
                      },
                    },
                    `Episode ${episode}`
                  ),
                  ...(tags ? tags.split(",").slice(0, 3).map((tag, index) => 
                    React.createElement(
                      "span",
                      {
                        key: `tag-${index}`,
                        style: {
                          background: "rgba(255, 255, 255, 0.15)",
                          color: config.textSecondary,
                          padding: "6px 16px",
                          borderRadius: "15px",
                          fontSize: "14px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                        },
                      },
                      tag.trim()
                    )
                  ) : []),
                ]
              ),

              // Date info
              date && React.createElement(
                "div",
                {
                  key: "date",
                  style: {
                    color: config.textSecondary,
                    fontSize: "18px",
                    opacity: 0.8,
                  },
                },
                new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              ),
            ].filter(Boolean)
          ),

          // Bottom decoration
          React.createElement(
            "div",
            {
              key: "bottom",
              style: {
                position: "absolute",
                bottom: "30px",
                right: "40px",
                color: config.textSecondary,
                fontSize: "16px",
                opacity: 0.7,
              },
            },
            siteDomain
          ),
        ]
      );
    };

    // Tech terminal template
    const getTechTemplate = () => {
      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            height: "100%",
            width: "100%",
            background: config.background,
            fontFamily: "Inter",
            position: "relative",
          },
        },
        [
          // Terminal header
          React.createElement(
            "div",
            {
              key: "header",
              style: {
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                height: "60px",
                background: "#1a1f3a",
                display: "flex",
                alignItems: "center",
                padding: "0 30px",
                borderBottom: "2px solid #2d3748",
              },
            },
            [
              React.createElement(
                "div",
                {
                  key: "controls",
                  style: {
                    display: "flex",
                    gap: "8px",
                  },
                },
                ["#ff5f56", "#ffbd2e", "#27ca3f"].map((color, index) =>
                  React.createElement("div", {
                    key: index,
                    style: {
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: color,
                    },
                  })
                )
              ),
              React.createElement(
                "div",
                {
                  key: "title-bar",
                  style: {
                    marginLeft: "20px",
                    color: "#718096",
                    fontSize: "14px",
                  },
                },
                `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${language}`
              ),
            ]
          ),

          // Code content
          React.createElement(
            "div",
            {
              key: "content",
              style: {
                padding: "80px 60px",
                paddingTop: "120px",
                height: "100%",
                color: config.textPrimary,
              },
            },
            [
              React.createElement(
                "div",
                {
                  key: "line1",
                  style: {
                    color: "#66d9ef",
                    fontSize: "20px",
                    marginBottom: "15px",
                  },
                },
                "const project = {"
              ),
              React.createElement(
                "div",
                {
                  key: "line2",
                  style: {
                    color: "#a6e22e",
                    fontSize: titleFontSize,
                    marginLeft: "40px",
                    marginBottom: "20px",
                    fontWeight: "bold",
                  },
                },
                `title: "${title.length > 50 ? `${title.substring(0, 50)}...` : title}",`
              ),
              description && React.createElement(
                "div",
                {
                  key: "line3",
                  style: {
                    color: "#e6db74",
                    fontSize: "24px",
                    marginLeft: "40px",
                    marginBottom: "20px",
                  },
                },
                `description: "${description.length > 60 ? `${description.substring(0, 60)}...` : description}",`
              ),
              date && React.createElement(
                "div",
                {
                  key: "line4",
                  style: {
                    color: "#ae81ff",
                    fontSize: "20px",
                    marginLeft: "40px",
                    marginBottom: "20px",
                  },
                },
                `published: "${new Date(date).toISOString().split("T")[0]}",`
              ),
              tags && React.createElement(
                "div",
                {
                  key: "line5",
                  style: {
                    color: "#fd971f",
                    fontSize: "18px",
                    marginLeft: "40px",
                    marginBottom: "20px",
                  },
                },
                `tags: [${tags.split(",").slice(0, 3).map(tag => `"${tag.trim()}"`).join(", ")}],`
              ),
              React.createElement(
                "div",
                {
                  key: "line6",
                  style: {
                    color: "#66d9ef",
                    fontSize: "20px",
                  },
                },
                "};"
              ),
            ].filter(Boolean)
          ),

          // Footer
          React.createElement(
            "div",
            {
              key: "footer",
              style: {
                position: "absolute",
                bottom: "40px",
                right: "40px",
                color: "#718096",
                fontSize: "16px",
              },
            },
            siteDomain
          ),
        ]
      );
    };

    // Podcast template with waveform visualization
    const getPodcastTemplate = () => {
      const waveformBars = Array.from({ length: 40 }, (_, i) => 
        React.createElement("div", {
          key: i,
          style: {
            width: "4px",
            height: `${Math.random() * 60 + 20}px`,
            background: config.accent,
            borderRadius: "2px",
            opacity: 0.7,
          },
        })
      );

      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            height: "100%",
            width: "100%",
            background: config.background,
            fontFamily: "Inter",
            position: "relative",
          },
        },
        [
          // Podcast header
          React.createElement(
            "div",
            {
              key: "header",
              style: {
                position: "absolute",
                top: "40px",
                left: "60px",
                right: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              },
            },
            [
              React.createElement(
                "div",
                {
                  key: "podcast-info",
                  style: {
                    display: "flex",
                    alignItems: "center",
                  },
                },
                [
                  React.createElement("div", {
                    key: "mic-icon",
                    style: {
                      width: "50px",
                      height: "50px",
                      background: config.accent,
                      borderRadius: "50%",
                      marginRight: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    },
                  }, "🎙️"),
                  React.createElement(
                    "div",
                    {
                      key: "title",
                      style: {
                        color: config.textPrimary,
                        fontSize: "18px",
                        fontWeight: "600",
                      },
                    },
                    episode ? `Episode ${episode}` : "Blog Post"
                  ),
                ]
              ),
              React.createElement(
                "div",
                {
                  key: "waveform",
                  style: {
                    display: "flex",
                    alignItems: "end",
                    gap: "3px",
                    height: "50px",
                  },
                },
                waveformBars
              ),
            ]
          ),

          // Main content
          React.createElement(
            "div",
            {
              key: "main",
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                padding: "120px 80px 80px",
                textAlign: "center",
              },
            },
            [
              React.createElement(
                "h1",
                {
                  key: "title",
                  style: {
                    fontSize: titleFontSize,
                    fontWeight: "bold",
                    color: config.textPrimary,
                    lineHeight: 1.1,
                    marginBottom: "30px",
                    maxWidth: "900px",
                  },
                },
                title
              ),
              description && React.createElement(
                "p",
                {
                  key: "description",
                  style: {
                    fontSize: "24px",
                    color: config.textSecondary,
                    lineHeight: 1.4,
                    marginBottom: "40px",
                    maxWidth: "700px",
                  },
                },
                description
              ),
              React.createElement(
                "div",
                {
                  key: "host",
                  style: {
                    background: config.accent,
                    color: "white",
                    padding: "20px 40px",
                    borderRadius: "30px",
                    fontSize: "20px",
                    fontWeight: "600",
                  },
                },
                "Hosted by Piyush Mehta"
              ),
            ].filter(Boolean)
          ),
        ]
      );
    };

    // Modern grid template
    const getModernTemplate = () => {
      const gridLines = Array.from({ length: 20 }, (_, i) => 
        React.createElement("div", {
          key: `grid-${i}`,
          style: {
            position: "absolute",
            [i % 2 === 0 ? "left" : "top"]: `${(i + 1) * 60}px`,
            [i % 2 === 0 ? "top" : "left"]: "0",
            [i % 2 === 0 ? "bottom" : "right"]: "0",
            [i % 2 === 0 ? "width" : "height"]: "1px",
            background: "rgba(255, 255, 255, 0.1)",
            opacity: 0.3,
          },
        })
      );

      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            height: "100%",
            width: "100%",
            background: config.background,
            fontFamily: "Inter",
            position: "relative",
            overflow: "hidden",
          },
        },
        [
          ...gridLines,
          React.createElement(
            "div",
            {
              key: "content",
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                padding: "80px",
                textAlign: "center",
                position: "relative",
                zIndex: 2,
              },
            },
            [
              React.createElement(
                "div",
                {
                  key: "badge",
                  style: {
                    background: config.accent,
                    color: "white",
                    padding: "8px 24px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "40px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  },
                },
                type === "article" ? "Blog Post" : "Project"
              ),
              React.createElement(
                "h1",
                {
                  key: "title",
                  style: {
                    fontSize: titleFontSize,
                    fontWeight: "bold",
                    color: config.textPrimary,
                    lineHeight: 1.1,
                    marginBottom: "30px",
                    maxWidth: "900px",
                  },
                },
                title
              ),
              description && React.createElement(
                "p",
                {
                  key: "description",
                  style: {
                    fontSize: "24px",
                    color: config.textSecondary,
                    lineHeight: 1.4,
                    marginBottom: "40px",
                    maxWidth: "700px",
                    opacity: 0.9,
                  },
                },
                description
              ),
              React.createElement(
                "div",
                {
                  key: "author",
                  style: {
                    color: config.textSecondary,
                    fontSize: "18px",
                    fontWeight: "500",
                  },
                },
                "by Piyush Mehta"
              ),
            ].filter(Boolean)
          ),
        ]
      );
    };

    // Template selection with fallback
    const getTemplate = () => {
      switch (template) {
        case "tech":
          return getTechTemplate();
        case "podcast":
          return getPodcastTemplate();
        case "modern":
          return getModernTemplate();
        case "minimal":
          return getSyntaxTemplate(); // Use syntax as base for minimal
        case "syntax":
        default:
          return getSyntaxTemplate();
      }
    };

    // Generate SVG with Satori
    const svg = await satori(getTemplate(), {
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
          data: interRegular,
          weight: 700,
          style: "normal",
        },
      ],
    });

    // Convert SVG to PNG
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
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "CDN-Cache-Control": "max-age=31536000",
        "Vercel-CDN-Cache-Control": "max-age=31536000",
        "Content-Length": pngBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating enhanced OG image:", error);

    Sentry.captureException(error, {
      tags: {
        endpoint: "enhanced_og_image",
        template,
        theme,
      },
      extra: {
        title,
        description,
        type,
        date,
        tags,
        episode,
        url: url.toString(),
      },
    });

    return new Response("Error generating image", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
};