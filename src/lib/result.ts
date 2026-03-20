// src/lib/result.ts
import type { AppError } from './errors'

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError }

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

// Returns { ok: false; error: AppError } — not parameterized, avoids Result<never>
export function err(error: AppError): { ok: false; error: AppError } {
  return { ok: false, error }
}
