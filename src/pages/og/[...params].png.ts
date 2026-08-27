import type { APIRoute, GetStaticPaths } from 'astro';
import { getSocialCardManifest } from '../../utils/social-card-manifest';
import { createSocialCardResponse } from '../../utils/social-card-renderer';
import type { SocialCardData } from '../../utils/social-card';

export const prerender = true;

export const getStaticPaths = (async () => {
  const manifest = await getSocialCardManifest();

  return [...manifest.values()].map((entry) => ({
    params: { params: entry.key },
    props: { card: entry.card },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const card = props.card as SocialCardData;
  const domain = (site || new URL('https://piyushmehta.com')).hostname;

  return createSocialCardResponse({ ...card, domain });
};
