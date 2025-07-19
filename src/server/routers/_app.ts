// Main tRPC Router - App Router
import { createTRPCRouter } from '../trpc';
import { newsletterRouter } from './newsletter';
import { ogImageRouter } from './og-image';

// Main app router that combines all routers
export const appRouter = createTRPCRouter({
  newsletter: newsletterRouter,
  ogImage: ogImageRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
