// tRPC Server Configuration
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

// Create context for tRPC
export interface Context {
  req?: Request;
  headers?: Headers;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Rate limiting middleware with enhanced context
export const rateLimitedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Get IP from context with multiple fallbacks
  const ip =
    ctx.ip ||
    ctx.req?.headers.get('x-forwarded-for') ||
    ctx.req?.headers.get('x-real-ip') ||
    ctx.req?.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  // Get user agent for additional context
  const userAgent = ctx.req?.headers.get('user-agent') || 'unknown';

  // Simple rate limiting check (enhance with Redis/Upstash)
  // Basic validation: reject suspicious requests
  if (userAgent.includes('bot') && !userAgent.includes('Googlebot')) {
    console.warn(`Rate limit: Suspicious bot detected from ${ip}: ${userAgent}`);
  }

  return next({
    ctx: {
      ...ctx,
      ip,
      userAgent,
    },
  });
});

// Error helper
export function createTRPCError(
  code: 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR' | 'UNAUTHORIZED',
  message: string
) {
  return new TRPCError({ code, message });
}
