import type { APIRoute } from 'astro';
import {
  cleanText,
  decodeSocialCardParams,
  getSocialCardDataFromSearchParams,
  titleFromSlug,
} from '../../../utils/social-card';
import { createSocialCardResponse } from '../../../utils/social-card-renderer';

export const prerender = false;

export const GET: APIRoute = async ({ params, url, site }) => {
  const searchParams = new URL(url).searchParams;
  const siteUrl = site || new URL('https://piyushmehta.com');
  const data = getSocialCardDataFromSearchParams(searchParams);

  if (!searchParams.has('title')) {
    const pathTitle = decodeSocialCardParams(params.params).join(' ');
    data.title = cleanText(pathTitle) || titleFromSlug(params.params || 'Piyush Mehta');
  }

  return createSocialCardResponse({
    ...data,
    domain: siteUrl.hostname,
  });
};
