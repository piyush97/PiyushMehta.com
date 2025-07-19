// tRPC Client Configuration
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/routers/_app';

// Create base URL for tRPC requests
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser: use relative URL
    return '';
  }

  // Server: use absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:4321';
}

// Create tRPC client
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      // Add headers if needed
      headers: () => {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});

// Export types for use in components
export type { AppRouter } from '../server/routers/_app';
