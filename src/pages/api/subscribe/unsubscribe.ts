import type { APIRoute } from 'astro';
import { ENV } from 'varlock/env';
import { captureException } from '@sentry/astro';
import { applyToken, hasUsableSecret, resultPage, verifyToken } from '@/utils/subscribe';
import { reactionRedis } from '@/utils/redis';

export const prerender = false;

/**
 * GET only shows a button, so mail scanners that prefetch links cannot unsubscribe anyone.
 * POST removes the address; it also serves the RFC 8058 one-click List-Unsubscribe request.
 * The signed token is the credential, so no origin check applies.
 */
export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  const secret = ENV.NEWSLETTER_SIGNING_SECRET;
  if (!hasUsableSecret(secret)) {
    return resultPage(
      503,
      'Service unavailable',
      'Unsubscribe is unavailable right now. Try again later.',
    );
  }
  if (!(await verifyToken(secret, token, 'unsubscribe'))) {
    return resultPage(
      400,
      'This link is not valid',
      'The unsubscribe link is invalid or has expired.',
    );
  }
  const action = new URL('/api/subscribe/unsubscribe', url);
  action.searchParams.set('token', token ?? '');
  return resultPage(200, 'Unsubscribe', 'Stop getting new post emails at this address.', {
    url: `${action.pathname}${action.search}`,
    label: 'Unsubscribe',
  });
};

export const POST: APIRoute = async ({ url }) => {
  try {
    const result = await applyToken(
      reactionRedis,
      ENV.NEWSLETTER_SIGNING_SECRET,
      url.searchParams.get('token'),
      'unsubscribe',
    );
    if (result === 'ok') {
      return resultPage(200, 'Unsubscribed', 'This address will not get new post emails.');
    }
    if (result === 'invalid') {
      return resultPage(
        400,
        'This link is not valid',
        'The unsubscribe link is invalid or has expired.',
      );
    }
    return resultPage(
      503,
      'Service unavailable',
      'Unsubscribe could not be saved. Try again in a few minutes.',
    );
  } catch {
    captureException(new Error('Subscribe unsubscribe failed.'));
    return resultPage(500, 'Something went wrong', 'Try the link again in a few minutes.');
  }
};
