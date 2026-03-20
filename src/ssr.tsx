import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
import * as Sentry from '@sentry/cloudflare'
import { createRouter } from './router'

const handler = createStartHandler({ createRouter })(defaultStreamHandler)

export default Sentry.withSentry(
  (env: Record<string, string>) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  }),
  handler,
)
