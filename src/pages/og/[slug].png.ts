import { getCollection } from 'astro:content';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import satori from 'satori';
import { html } from 'satori-html';
import OgImage from '../../components/OgImage.astro';

// Load custom font
const fontData = fs.readFileSync(path.resolve('./public/fonts/Inter-Bold.otf'));

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.slug },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const post = (await getCollection('blog')).find((p) => p.slug === slug);

  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  // Using an Astro component to generate the markup
  const markup = html(
    `<${OgImage.tagName} title="${post.data.title}" description="${post.data.description}"></${OgImage.tagName}>`
  );

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
};
