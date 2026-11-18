import type { APIRoute, GetStaticPaths } from 'astro';
import { labCardForKey, labDemos } from '../../../data/lab';
import { createSocialCardResponse } from '../../../utils/social-card-renderer';

export const prerender = true;

export const getStaticPaths = (() =>
  ['index', ...labDemos.map((demo) => demo.slug)].map((key) => ({
    params: { key },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params, site }) => {
  const card = labCardForKey(params.key ?? '');
  if (!card) return new Response('Not found', { status: 404 });
  const domain = (site || new URL('https://piyushmehta.com')).hostname;
  return createSocialCardResponse({ ...card, domain });
};
