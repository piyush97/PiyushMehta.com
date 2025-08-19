// tRPC API Handler for Astro

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { APIRoute } from 'astro';
import { appRouter } from '../../../server/routers/_app';
import type { Context } from '../../../server/trpc';

// Create context for tRPC requests
function createContext(request: Request): Context {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return {
    req: request,
    headers: request.headers,
    ip,
    userAgent,
    timestamp: new Date(),
  };
}

// Handle all HTTP methods for tRPC
const handler: APIRoute = async ({ request }) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
    onError: ({ error, path }) => {
      console.error(`tRPC Error on ${path}:`, error);
    },
  });
};

// Export handlers for all HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
