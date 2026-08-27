import type { APIRoute } from 'astro';
export const prerender = true;

export const GET: APIRoute = () =>
  Response.redirect(new URL('/opengraph-image', 'https://piyushmehta.com'), 308);
