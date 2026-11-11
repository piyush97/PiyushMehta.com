import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import { applyToken, resultPage } from '@/utils/subscribe';
import { reactionRedis } from '@/utils/redis';

export const prerender = false;

/** Double opt-in: the signed link from the confirmation email adds the address to the subscriber set. */
export const GET: APIRoute = async ({ url }) => {
  try {
    const result = await applyToken(
      reactionRedis,
      ENV.NEWSLETTER_SIGNING_SECRET,
      url.searchParams.get('token'),
      'confirm',
    );
    if (result === 'ok') {
      return resultPage(
        200,
        'Subscription confirmed',
        'You will get an email when a new post is published. Every email has an unsubscribe link.',
      );
    }
    if (result === 'invalid') {
      return resultPage(
        400,
        'This link is not valid',
        'The confirmation link is invalid or has expired. Submit the form again to get a new one.',
      );
    }
    return resultPage(
      503,
      'Service unavailable',
      'The subscription could not be saved right now. Open the link again in a few minutes.',
    );
  } catch {
    captureException(new Error('Subscribe confirm failed.'));
    return resultPage(500, 'Something went wrong', 'Open the link again in a few minutes.');
  }
};
