// src/lib/errors.ts
export type AppError =
  | { type: 'validation'; fields: Record<string, string> }
  | { type: 'rate_limited'; retryAfter: number }
  | { type: 'not_found'; resource: string }
  | { type: 'internal' }

export function internalError(): AppError {
  return { type: 'internal' }
}
export function notFoundError(resource: string): AppError {
  return { type: 'not_found', resource }
}
export function validationError(fields: Record<string, string>): AppError {
  return { type: 'validation', fields }
}
export function rateLimitedError(retryAfter = 60): AppError {
  return { type: 'rate_limited', retryAfter }
}
