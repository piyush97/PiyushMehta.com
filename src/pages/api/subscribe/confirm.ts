import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import { applyToken, hasUsableSecret, resultPage, verifyToken } from '@/utils/subscribe';
import { reactionRedis } from '@/utils/redis';

export const prerender = false;

/**
 * Double opt-in. GET only shows a button, so mail scanners that prefetch links cannot subscribe
 * anyone. POST adds the address. The signed token is the credential, so no origin check applies.
 */
export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  const secret = ENV.NEWSLETTER_SIGNING_SECRET;
  if (!hasUsableSecret(secret)) {
    return resultPage(
      503,
      'Service unavailable',
      'The subscription cannot be confirmed right now. Open the link again in a few minutes.',
    );
  }
  if (!(await verifyToken(secret, token, 'confirm'))) {
    return resultPage(
      400,
      'This link is not valid',
      'The confirmation link is invalid or has expired. Submit the form again to get a new one.',
    );
  }
  const action = new URL('/api/subscribe/confirm', url);
  action.searchParams.set('token', token ?? '');
  return resultPage(
    200,
    'Confirm your subscription',
    'Get an email when a new post is published. Every email has an unsubscribe link.',
    { url: `${action.pathname}${action.search}`, label: 'Confirm subscription' },
  );
};

export const POST: APIRoute = async ({ url }) => {
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
