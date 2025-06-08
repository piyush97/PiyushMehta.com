import type { APIRoute } from 'astro';
import { generateOgImage } from '../../../utils/og-generator';

export const get: APIRoute = async ({ params }) => {
  const slug = params.slug || 'home';

  try {
    // Remove file extension if it exists (like .png)
    const cleanSlug = slug.replace(/\.\w+$/, '');

    // Convert slug like "contact-me" to page path like "contact-me"
    const path = cleanSlug === 'home' ? '' : cleanSlug.replace(/-/g, '/');

    // Generate OG image
    const buffer = await generateOgImage(path);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', {
      status: 500,
    });
  }
};
