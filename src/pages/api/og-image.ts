import type { APIRoute } from 'astro';
import { getSocialCardDataFromSearchParams } from '../../utils/social-card';
import { createSocialCardResponse } from '../../utils/social-card-renderer';

export const prerender = false;

export const GET: APIRoute = async ({ url, site }) => {
  const siteUrl = site || new URL('https://piyushmehta.com');

  return createSocialCardResponse({
    ...getSocialCardDataFromSearchParams(new URL(url).searchParams),
    domain: siteUrl.hostname,
  });
};
