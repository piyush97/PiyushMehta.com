// 🎨 UltraThink™ OG Image Generation Engine
// Advanced Satori-based dynamic OG image generation with creative templates

import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

// 🛡️ Text Sanitization for SVG Safety
function sanitizeText(text: string): string {
  if (!text) return "";

  return (
    text
      // First, handle any existing entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      // Then escape everything properly
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      // Handle special Unicode characters and control characters
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
      // Normalize whitespace
      .replace(/\r?\n/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// 🎯 Core Types & Interfaces
export interface OGImageParams {
  title: string;
  description?: string;
  author?: string;
  publishedTime?: Date;
  tags?: string[];
  template?:
    | "default"
    | "minimal"
    | "tech"
    | "blog"
    | "cyber"
    | "gradient"
    | "terminal"
    | "modern"
    | "professional";
  theme?: "dark" | "light" | "retro" | "neon" | "corporate" | "warm" | "ocean";
  pageType?:
    | "article"
    | "website"
    | "project"
    | "about"
    | "contact"
    | "services"
    | "portfolio";
  brandColor?: string;
  accentColor?: string;
  showLogo?: boolean;
  showBadge?: boolean;
  customIcon?: string;
  readingTime?: number;
  category?: string;
}

export interface FontData {
  name: string;
  data: Buffer;
  weight: number;
  style: "normal" | "italic";
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  gradient: string;
}

// 🎨 Color Palettes & Design System
const DESIGN_SYSTEM = {
  themes: {
    dark: {
      primary: "#0f1419",
      secondary: "#1a1a2e",
      accent: "#3b82f6",
      text: "#ffffff",
      textSecondary: "#a0a9b8",
      border: "#2d3748",
      gradient: "linear-gradient(135deg, #0f1419 0%, #1a1a2e 100%)",
    },
    light: {
      primary: "#ffffff",
      secondary: "#f8fafc",
      accent: "#2563eb",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      gradient: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    },
    retro: {
      primary: "#2a1810",
      secondary: "#3c2414",
      accent: "#ff6b35",
      text: "#f4e4c1",
      textSecondary: "#d4af37",
      border: "#8b4513",
      gradient: "linear-gradient(135deg, #2a1810 0%, #3c2414 100%)",
    },
    neon: {
      primary: "#0a0a0f",
      secondary: "#1a1a2e",
      accent: "#00ff88",
      text: "#ffffff",
      textSecondary: "#8892b0",
      border: "#233554",
      gradient: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
    },
    corporate: {
      primary: "#1e3a8a",
      secondary: "#1e40af",
      accent: "#3b82f6",
      text: "#ffffff",
      textSecondary: "#cbd5e1",
      border: "#3730a3",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    },
    warm: {
      primary: "#7c2d12",
      secondary: "#9a3412",
      accent: "#ea580c",
      text: "#ffffff",
      textSecondary: "#fed7aa",
      border: "#c2410c",
      gradient: "linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)",
    },
    ocean: {
      primary: "#164e63",
      secondary: "#0e7490",
      accent: "#06b6d4",
      text: "#ffffff",
      textSecondary: "#a7f3d0",
      border: "#0891b2",
      gradient: "linear-gradient(135deg, #164e63 0%, #0e7490 100%)",
    },
  },
  typography: {
    title: {
      large: "72px",
      medium: "56px",
      small: "44px",
    },
    subtitle: {
      large: "32px",
      medium: "24px",
      small: "20px",
    },
    body: {
      large: "20px",
      medium: "16px",
      small: "14px",
    },
  },
  spacing: {
    xl: "80px",
    lg: "60px",
    md: "40px",
    sm: "24px",
    xs: "16px",
  },
};

// 🔧 Font Loading Utilities
const fontCache: Map<string, FontData> = new Map();

async function loadFont(
  name: string,
  weight: number = 400,
  style: "normal" | "italic" = "normal"
): Promise<FontData> {
  const cacheKey = `${name}-${weight}-${style}`;

  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  try {
    const fontPath = path.join(process.cwd(), "public", "fonts", `${name}.otf`);
    const fontBuffer = fs.readFileSync(fontPath);

    const fontData: FontData = {
      name,
      data: fontBuffer,
      weight,
      style,
    };

    fontCache.set(cacheKey, fontData);
    return fontData;
  } catch (error) {
    console.warn(`Failed to load font ${name}:`, error);

    // Fallback to system font
    const fallbackData: FontData = {
      name: "system-ui",
      data: Buffer.from(""), // Empty buffer for system font
      weight,
      style,
    };

    return fallbackData;
  }
}

// 🎨 Creative Template Generators

/**
 * 🌟 Modern Blog Template - Clean, professional, content-focused
 */
function createModernBlogTemplate(params: OGImageParams, theme: ThemeConfig) {
  const { title, description, publishedTime, tags, readingTime } =
    params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.gradient,
        padding: DESIGN_SYSTEM.spacing.xl,
        fontFamily: "Inter",
        color: theme.text,
        position: "relative",
      },
      children: [
        // Background Pattern
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              opacity: "0.05",
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            },
          },
        },

        // Header Section
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: DESIGN_SYSTEM.spacing.lg,
            },
            children: [
              // Logo/Brand
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: theme.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: theme.primary,
                        },
                        children: "PM",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: "600",
                          color: theme.text,
                        },
                        children: "Piyush Mehta",
                      },
                    },
                  ],
                },
              },

              // Reading Time & Date
              publishedTime && {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "8px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: DESIGN_SYSTEM.typography.body.medium,
                          color: theme.textSecondary,
                        },
                        children: publishedTime.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                      },
                    },
                    readingTime && {
                      type: "span",
                      props: {
                        style: {
                          fontSize: DESIGN_SYSTEM.typography.body.small,
                          color: theme.accent,
                          fontWeight: "500",
                        },
                        children: `${readingTime} min read`,
                      },
                    },
                  ].filter(Boolean),
                },
              },
            ].filter(Boolean),
          },
        },

        // Main Content
        {
          type: "div",
          props: {
            style: {
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: DESIGN_SYSTEM.spacing.md,
            },
            children: [
              // Title
              {
                type: "h1",
                props: {
                  style: {
                    fontSize:
                      title.length > 50
                        ? DESIGN_SYSTEM.typography.title.medium
                        : DESIGN_SYSTEM.typography.title.large,
                    fontWeight: "bold",
                    lineHeight: "1.1",
                    margin: "0",
                    maxWidth: "1000px",
                    color: theme.text,
                  },
                  children: title,
                },
              },

              // Description
              description && {
                type: "p",
                props: {
                  style: {
                    fontSize: DESIGN_SYSTEM.typography.subtitle.medium,
                    lineHeight: "1.5",
                    margin: "0",
                    maxWidth: "900px",
                    color: theme.textSecondary,
                    opacity: "0.9",
                  },
                  children:
                    description.length > 120
                      ? `${description.substring(0, 117)}...`
                      : description,
                },
              },
            ].filter(Boolean),
          },
        },

        // Footer Section
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `2px solid ${theme.border}`,
              paddingTop: DESIGN_SYSTEM.spacing.md,
            },
            children: [
              // Tags
              tags &&
                tags.length > 0 && {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    },
                    children: tags.slice(0, 4).map((tag) => ({
                      type: "span",
                      props: {
                        style: {
                          padding: "8px 16px",
                          borderRadius: "20px",
                          backgroundColor: `${theme.accent}20`,
                          border: `1px solid ${theme.accent}`,
                          fontSize: DESIGN_SYSTEM.typography.body.small,
                          fontWeight: "500",
                          color: theme.accent,
                        },
                        children: `#${tag}`,
                      },
                    })),
                  },
                },

              // Blog Badge
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 20px",
                    borderRadius: "25px",
                    backgroundColor: `${theme.accent}15`,
                    border: `1px solid ${theme.accent}`,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: theme.accent,
                        },
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: DESIGN_SYSTEM.typography.body.medium,
                          fontWeight: "600",
                          color: theme.accent,
                        },
                        children: "Blog Post",
                      },
                    },
                  ],
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

/**
 * 🌈 Gradient Tech Template - Modern, vibrant, tech-focused
 */
function createGradientTechTemplate(params: OGImageParams, theme: ThemeConfig) {
  const { title, description, tags, category } = params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.accent}20 100%)`,
        padding: DESIGN_SYSTEM.spacing.xl,
        fontFamily: "Inter",
        color: theme.text,
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Geometric Background Elements
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accent}40 0%, transparent 70%)`,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "-150px",
              left: "-150px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accent}20 0%, transparent 70%)`,
            },
          },
        },

        // Tech Grid Pattern
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              opacity: "0.1",
              backgroundImage: `linear-gradient(${theme.accent}40 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}40 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            },
          },
        },

        // Header with Tech Badge
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              zIndex: "2",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  },
                  children: [
                    // Tech Icon
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "56px",
                          height: "56px",
                          borderRadius: "16px",
                          background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}80 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                          color: theme.primary,
                          fontWeight: "bold",
                        },
                        children: "</>", // Code icon
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "22px",
                                fontWeight: "bold",
                                color: theme.text,
                              },
                              children: "Piyush Mehta",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "16px",
                                color: theme.accent,
                                fontWeight: "500",
                              },
                              children: "Senior Software Engineer",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },

              // Category Badge
              category && {
                type: "div",
                props: {
                  style: {
                    padding: "12px 24px",
                    borderRadius: "30px",
                    background: `linear-gradient(135deg, ${theme.accent}30 0%, ${theme.accent}50 100%)`,
                    border: `2px solid ${theme.accent}`,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: theme.accent,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  },
                  children: category,
                },
              },
            ].filter(Boolean),
          },
        },

        // Main Title Section
        {
          type: "div",
          props: {
            style: {
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              zIndex: "2",
            },
            children: [
              {
                type: "h1",
                props: {
                  style: {
                    fontSize: title.length > 40 ? "58px" : "72px",
                    fontWeight: "bold",
                    lineHeight: "1.1",
                    margin: "0 0 32px 0",
                    background: `linear-gradient(135deg, ${theme.text} 0%, ${theme.accent} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    maxWidth: "1000px",
                  },
                  children: title,
                },
              },

              description && {
                type: "p",
                props: {
                  style: {
                    fontSize: "28px",
                    lineHeight: "1.4",
                    margin: "0",
                    maxWidth: "900px",
                    color: theme.textSecondary,
                    fontWeight: "400",
                  },
                  children:
                    description.length > 100
                      ? `${description.substring(0, 97)}...`
                      : description,
                },
              },
            ].filter(Boolean),
          },
        },

        // Bottom Tech Elements
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: "2",
            },
            children: [
              // Tech Stack Tags
              tags &&
                tags.length > 0 && {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      gap: "16px",
                    },
                    children: tags.slice(0, 3).map((tag) => ({
                      type: "div",
                      props: {
                        style: {
                          padding: "10px 20px",
                          borderRadius: "25px",
                          background: `linear-gradient(135deg, ${theme.accent}20 0%, ${theme.accent}40 100%)`,
                          border: `1px solid ${theme.accent}80`,
                          fontSize: "16px",
                          fontWeight: "600",
                          color: theme.accent,
                        },
                        children: tag,
                      },
                    })),
                  },
                },

              // Decorative Tech Element
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "40px",
                          height: "6px",
                          borderRadius: "3px",
                          background: `linear-gradient(90deg, ${theme.accent} 0%, transparent 100%)`,
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: theme.accent,
                        },
                      },
                    },
                  ],
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

/**
 * 🖥️ Terminal/Cyber Template - Dark, code-focused, hacker aesthetic
 */
function createTerminalTemplate(params: OGImageParams, _theme: ThemeConfig) {
  const { title, description, author, tags } = params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0f",
        backgroundImage:
          "radial-gradient(circle at 25% 25%, #1a1a2e 0%, #0a0a0f 50%)",
        padding: DESIGN_SYSTEM.spacing.xl,
        fontFamily: "monospace",
        color: "#00ff88",
        position: "relative",
      },
      children: [
        // Terminal Window Frame
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "40px",
              left: "40px",
              right: "40px",
              bottom: "40px",
              border: "2px solid #00ff88",
              borderRadius: "12px",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
          },
        },

        // Terminal Header
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "40px",
              zIndex: "2",
            },
            children: [
              // Terminal Dots
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "8px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: "#ff5f56",
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: "#ffbd2e",
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: "#27ca3f",
                        },
                      },
                    },
                  ],
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "18px",
                    color: "#8892b0",
                    fontFamily: "monospace",
                    marginLeft: "20px",
                  },
                  children: "~/piyush-mehta/blog $",
                },
              },
            ],
          },
        },

        // Terminal Content
        {
          type: "div",
          props: {
            style: {
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "32px",
              zIndex: "2",
            },
            children: [
              // Command Line Style Title
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "monospace",
                    fontSize: "20px",
                    color: "#8892b0",
                    marginBottom: "16px",
                  },
                  children: "> cat blog-post.md",
                },
              },

              // Title
              {
                type: "h1",
                props: {
                  style: {
                    fontSize: title.length > 45 ? "56px" : "68px",
                    fontWeight: "bold",
                    lineHeight: "1.1",
                    margin: "0",
                    color: "#00ff88",
                    fontFamily: "monospace",
                    textShadow: "0 0 20px rgba(0, 255, 136, 0.5)",
                    maxWidth: "1000px",
                  },
                  children: title,
                },
              },

              // Description with typing effect styling
              description && {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "24px",
                          lineHeight: "1.4",
                          color: "#a7f3d0",
                          fontFamily: "monospace",
                          maxWidth: "900px",
                        },
                        children:
                          description.length > 80
                            ? `${description.substring(0, 77)}...`
                            : description,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "12px",
                          height: "24px",
                          backgroundColor: "#00ff88",
                          animation: "blink 1s infinite",
                        },
                      },
                    },
                  ],
                },
              },
            ].filter(Boolean),
          },
        },

        // Terminal Footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: "2",
              borderTop: "1px solid #00ff88",
              paddingTop: "24px",
            },
            children: [
              // System Info
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "monospace",
                    fontSize: "14px",
                    color: "#8892b0",
                  },
                  children: `user@piyush-blog:~$ whoami → ${
                    author || "Piyush Mehta"
                  }`,
                },
              },

              // Tags as commands
              tags &&
                tags.length > 0 && {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      gap: "16px",
                    },
                    children: tags.slice(0, 3).map((tag) => ({
                      type: "span",
                      props: {
                        style: {
                          fontFamily: "monospace",
                          fontSize: "14px",
                          color: "#00ff88",
                          padding: "4px 8px",
                          border: "1px solid #00ff88",
                          borderRadius: "4px",
                        },
                        children: `--${tag}`,
                      },
                    })),
                  },
                },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

/**
 * ✨ Minimal Clean Template - Elegant, typography-focused
 */
function createMinimalTemplate(params: OGImageParams, theme: ThemeConfig) {
  const { title, description, author, publishedTime } = params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.primary,
        padding: DESIGN_SYSTEM.spacing.xl,
        fontFamily: "Inter",
        color: theme.text,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      },
      children: [
        // Minimal Logo/Initial
        {
          type: "div",
          props: {
            style: {
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: theme.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "bold",
              color: theme.primary,
              marginBottom: "48px",
            },
            children: "PM",
          },
        },

        // Title
        {
          type: "h1",
          props: {
            style: {
              fontSize: title.length > 50 ? "52px" : "64px",
              fontWeight: "300",
              lineHeight: "1.2",
              margin: "0 0 32px 0",
              maxWidth: "900px",
              color: theme.text,
              letterSpacing: "-0.02em",
            },
            children: title,
          },
        },

        // Description
        description && {
          type: "p",
          props: {
            style: {
              fontSize: "24px",
              lineHeight: "1.5",
              margin: "0 0 48px 0",
              maxWidth: "700px",
              color: theme.textSecondary,
              fontWeight: "400",
            },
            children:
              description.length > 120
                ? `${description.substring(0, 117)}...`
                : description,
          },
        },

        // Minimal Divider
        {
          type: "div",
          props: {
            style: {
              width: "100px",
              height: "2px",
              backgroundColor: theme.accent,
              marginBottom: "32px",
            },
          },
        },

        // Author & Date
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: "18px",
              color: theme.textSecondary,
            },
            children: [
              author && {
                type: "span",
                props: {
                  style: { fontWeight: "500" },
                  children: author,
                },
              },
              publishedTime && {
                type: "span",
                props: {
                  children: publishedTime.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                },
              },
            ].filter(Boolean),
          },
        },
      ].filter(Boolean),
    },
  };
}

/**
 * 🏢 Professional Template - Corporate, service-focused
 */
function createProfessionalTemplate(params: OGImageParams, theme: ThemeConfig) {
  const { title, description, pageType } = params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
        fontFamily: "Inter",
        color: theme.text,
        position: "relative",
      },
      children: [
        // Left Content Panel
        {
          type: "div",
          props: {
            style: {
              flex: "1",
              padding: DESIGN_SYSTEM.spacing.xl,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            },
            children: [
              // Header
              {
                type: "div",
                props: {
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          marginBottom: "40px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: "60px",
                                height: "60px",
                                borderRadius: "15px",
                                background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}80 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "28px",
                                fontWeight: "bold",
                                color: theme.primary,
                              },
                              children: "PM",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: "24px",
                                      fontWeight: "bold",
                                      color: theme.text,
                                    },
                                    children: "Piyush Mehta",
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: "16px",
                                      color: theme.accent,
                                      fontWeight: "500",
                                    },
                                    children: "Senior Software Engineer",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },

              // Main Content
              {
                type: "div",
                props: {
                  children: [
                    {
                      type: "h1",
                      props: {
                        style: {
                          fontSize: title.length > 40 ? "48px" : "56px",
                          fontWeight: "bold",
                          lineHeight: "1.2",
                          margin: "0 0 24px 0",
                          color: theme.text,
                        },
                        children: title,
                      },
                    },
                    description && {
                      type: "p",
                      props: {
                        style: {
                          fontSize: "22px",
                          lineHeight: "1.5",
                          margin: "0",
                          color: theme.textSecondary,
                          maxWidth: "500px",
                        },
                        children:
                          description.length > 100
                            ? `${description.substring(0, 97)}...`
                            : description,
                      },
                    },
                  ].filter(Boolean),
                },
              },

              // Service Badge
              {
                type: "div",
                props: {
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 24px",
                    borderRadius: "30px",
                    backgroundColor: `${theme.accent}20`,
                    border: `2px solid ${theme.accent}`,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: theme.accent,
                    alignSelf: "flex-start",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: theme.accent,
                        },
                      },
                    },
                    pageType === "services"
                      ? "Professional Services"
                      : pageType === "about"
                      ? "About Me"
                      : pageType === "contact"
                      ? "Get In Touch"
                      : "Professional Portfolio",
                  ],
                },
              },
            ],
          },
        },

        // Right Accent Panel
        {
          type: "div",
          props: {
            style: {
              width: "300px",
              background: `linear-gradient(135deg, ${theme.accent}20 0%, ${theme.accent}40 100%)`,
              position: "relative",
              overflow: "hidden",
            },
            children: [
              // Geometric Pattern
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.accent}30 2px, transparent 2px)`,
                    backgroundSize: "30px 30px",
                  },
                },
              },

              // Large Accent Element
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    bottom: "-100px",
                    right: "-100px",
                    width: "300px",
                    height: "300px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${theme.accent}60 0%, transparent 70%)`,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// 🎯 Default Template (Clean and Simple)
function createDefaultTemplate(params: OGImageParams, theme: ThemeConfig) {
  const { title, description, author = "Piyush Mehta" } = params;

  // Sanitize all text content
  const safeTitle = sanitizeText(title);
  const safeDescription = sanitizeText(description || "");
  const safeAuthor = sanitizeText(author);

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.primary,
        backgroundImage: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
        fontFamily: "Inter",
        color: theme.text,
        padding: "40px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: "64px",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "20px",
              lineHeight: 1.2,
              maxWidth: "1000px",
            },
            children: safeTitle,
          },
        },
        description && {
          type: "div",
          props: {
            style: {
              fontSize: "28px",
              textAlign: "center",
              color: theme.textSecondary,
              maxWidth: "800px",
              marginBottom: "30px",
              lineHeight: 1.4,
            },
            children: safeDescription,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "20px",
              color: theme.accent,
              textAlign: "center",
            },
            children: safeAuthor,
          },
        },
      ].filter(Boolean),
    },
  };
}

// 🔥 Cyber Template (Futuristic Design)
function createCyberTemplate(params: OGImageParams, _theme: ThemeConfig) {
  const { title, description, tags = [] } = params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0f",
        backgroundImage:
          "linear-gradient(135deg, #0a0a0f 0%, #1a0033 50%, #0a0a0f 100%)",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Cyber grid background
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            },
          },
        },
        // Main content
        {
          type: "div",
          props: {
            style: {
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "40px",
              zIndex: 1,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "60px",
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "#00ffff",
                    textShadow:
                      "0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff",
                    marginBottom: "20px",
                    lineHeight: 1.2,
                    maxWidth: "1000px",
                    fontFamily: "monospace",
                  },
                  children: title,
                },
              },
              description && {
                type: "div",
                props: {
                  style: {
                    fontSize: "24px",
                    textAlign: "center",
                    color: "#ffffff",
                    maxWidth: "800px",
                    marginBottom: "30px",
                    lineHeight: 1.4,
                  },
                  children: description,
                },
              },
              tags.length > 0 && {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  },
                  children: tags.slice(0, 4).map((tag) => ({
                    type: "div",
                    props: {
                      style: {
                        padding: "8px 16px",
                        backgroundColor: "rgba(0, 255, 255, 0.2)",
                        border: "1px solid #00ffff",
                        borderRadius: "4px",
                        fontSize: "16px",
                        color: "#00ffff",
                        fontFamily: "monospace",
                      },
                      children: `#${tag}`,
                    },
                  })),
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

// 🎨 Gradient Creative Template
function createGradientCreativeTemplate(params: OGImageParams, _theme: ThemeConfig) {
  const { title, description } = params;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)",
        fontFamily: "Inter",
        color: "#ffffff",
        padding: "40px",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Floating shapes background
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "10%",
              left: "10%",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "60%",
              right: "15%",
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              transform: "rotate(45deg)",
            },
          },
        },
        // Main content
        {
          type: "div",
          props: {
            style: {
              textAlign: "center",
              zIndex: 1,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "68px",
                    fontWeight: "bold",
                    marginBottom: "20px",
                    lineHeight: 1.2,
                    maxWidth: "1000px",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  },
                  children: title,
                },
              },
              description && {
                type: "div",
                props: {
                  style: {
                    fontSize: "28px",
                    maxWidth: "800px",
                    marginBottom: "30px",
                    lineHeight: 1.4,
                    opacity: 0.9,
                  },
                  children: description,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "22px",
                    opacity: 0.8,
                  },
                  children: "Creative • Innovative • Bold",
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

// 🎨 Template Registry
const TEMPLATE_REGISTRY = {
  default: createDefaultTemplate,
  blog: createModernBlogTemplate,
  tech: createGradientTechTemplate,
  gradient: createGradientCreativeTemplate,
  cyber: createCyberTemplate,
  terminal: createTerminalTemplate,
  minimal: createMinimalTemplate,
  professional: createProfessionalTemplate,
  modern: createModernBlogTemplate,
};

// 🤖 Intelligent Template Selection
function selectOptimalTemplate(params: OGImageParams): string {
  const { pageType, tags, template } = params;

  // Explicit template override
  if (template && TEMPLATE_REGISTRY[template]) {
    return template;
  }

  // Intelligent selection based on content
  if (pageType === "article") {
    if (
      tags?.some((tag) =>
        ["typescript", "javascript", "react", "node", "api"].includes(
          tag.toLowerCase()
        )
      )
    ) {
      return "tech";
    }
    return "blog";
  }

  if (
    pageType === "services" ||
    pageType === "about" ||
    pageType === "contact"
  ) {
    return "professional";
  }

  if (pageType === "project") {
    return "tech";
  }

  return "default";
}

/**
 * 🚀 Main OG Image Generation Function
 */
export async function generateOGImage(params: OGImageParams): Promise<Buffer> {
  try {
    // Load fonts
    const fonts = await Promise.all([
      loadFont("Inter-Regular", 400),
      loadFont("Inter-Medium", 500),
      loadFont("Inter-Bold", 700),
    ]);

    // Get theme configuration
    const themeConfig = DESIGN_SYSTEM.themes[params.theme || "dark"];

    // Select optimal template
    const templateName = selectOptimalTemplate(params);
    const templateFunction =
      TEMPLATE_REGISTRY[templateName] || TEMPLATE_REGISTRY.default;

    // Sanitize all text content in params to prevent SVG parsing issues
    const sanitizedParams = {
      ...params,
      title: sanitizeText(params.title),
      description: params.description
        ? sanitizeText(params.description)
        : undefined,
      author: params.author ? sanitizeText(params.author) : undefined,
      category: params.category ? sanitizeText(params.category) : undefined,
      tags: params.tags?.map((tag) => sanitizeText(tag)) || [],
    };

    // Generate JSX structure
    const jsx = templateFunction(sanitizedParams, themeConfig);

    // Generate SVG using Satori
    const svg = await satori(jsx, {
      width: 1200,
      height: 630,
      fonts: fonts
        .filter((font) => font.data.length > 0)
        .map((font) => ({
          name: font.name,
          data: font.data,
          weight: font.weight,
          style: font.style,
        })),
    });

    // Additional SVG sanitization for Resvg compatibility
    const sanitizedSvg = svg
      .replace(/&(?![a-zA-Z0-9#]{1,6};)/g, "&amp;") // Fix unescaped ampersands
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ""); // Remove control chars

    // Convert SVG to PNG using Resvg
    const resvg = new Resvg(sanitizedSvg, {
      background: "rgba(255, 255, 255, 0)",
      fitTo: {
        mode: "width",
        value: 1200,
      },
    });

    const pngData = resvg.render();
    return Buffer.from(pngData.asPng());
  } catch (error) {
    console.error("Error generating OG image:", error);

    // Return a simple fallback image
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#1a1a2e"/>
        <text x="600" y="315" font-family="Arial" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${params.title || "Piyush Mehta"}
        </text>
      </svg>
    `;

    const resvg = new Resvg(fallbackSvg);
    const pngData = resvg.render();
    return Buffer.from(pngData.asPng());
  }
}

// 🎯 Export template functions for testing
export {
  createGradientTechTemplate,
  createMinimalTemplate,
  createModernBlogTemplate,
  createProfessionalTemplate,
  createTerminalTemplate,
  DESIGN_SYSTEM,
  selectOptimalTemplate,
};
