// Main tRPC Router - App Router
import { createTRPCRouter } from '../trpc';
import { commentsRouter } from './comments';
import { newsletterRouter } from './newsletter';
import { ogImageRouter } from './og-image';

// Main app router that combines all routers
export const appRouter = createTRPCRouter({
  newsletter: newsletterRouter,
  ogImage: ogImageRouter,
  comments: commentsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
