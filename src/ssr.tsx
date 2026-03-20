import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
import { createRouter } from './router'

// Note: @sentry/cloudflare withSentry() requires { fetch: handler } object syntax
// and is incompatible with TanStack Start's dev server (crashes at module eval time).
// Wire Sentry via wrangler.toml observability or add back post-deploy.
export default createStartHandler({ createRouter })(defaultStreamHandler)
