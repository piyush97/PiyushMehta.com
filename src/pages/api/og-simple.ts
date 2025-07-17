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

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const title = searchParams.get('title') || 'Test Image';

    // Load fonts from local files
    const fontPath = join(process.cwd(), "InterVariable.ttf");
    const interRegular = fs.readFileSync(fontPath);

    // Create simple template
    const template = React.createElement(
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
      title
    );

    // Generate SVG with Satori
    const svg = await satori(template, {
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
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating simple OG image:', error);
    return new Response(`Error generating simple OG image: ${error.message}`, { status: 500 });
  }
};