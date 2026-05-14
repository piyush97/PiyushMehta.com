import type { APIRoute } from 'astro';
import {
  getSocialCardDataFromSearchParams,
  SOCIAL_CARD_CONTENT_TYPE,
  SOCIAL_CARD_SIZE,
} from '../utils/social-card';
import { createSocialCardResponse } from '../utils/social-card-renderer';

export const prerender = false;

export const alt = 'Piyush Mehta - Senior Software Engineer social preview';
export const size = SOCIAL_CARD_SIZE;
export const contentType = SOCIAL_CARD_CONTENT_TYPE;

export const GET: APIRoute = async ({ url, site }) => {
  const siteUrl = site || new URL('https://piyushmehta.com');

  return createSocialCardResponse({
    ...getSocialCardDataFromSearchParams(new URL(url).searchParams),
    domain: siteUrl.hostname,
  });
};
