// Security utilities for enhanced protection
import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Certificate Transparency monitoring headers
 */
export async function getCertificateTransparencyHeaders(): Promise<Record<string, string> | null> {
  try {
    // In production, this would integrate with Certificate Transparency logs
    // For now, return basic CT monitoring headers
    const headers: Record<string, string> = {};

    // Report Certificate Transparency violations
    headers['Expect-CT'] = 'max-age=86400, report-uri="https://piyushmehta.com/api/ct-report"';

    return headers;
  } catch (error) {
    console.warn('Certificate Transparency headers generation failed:', error);
    return null;
  }
}

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Nonce settings
  NONCE_LENGTH: 16,

  // HSTS settings
  HSTS_MAX_AGE: 63072000, // 2 years

  // CSP report URI
  CSP_REPORT_URI: '/api/csp-report',

  // Rate limiting settings
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  // IP reputation settings
  IP_REPUTATION_THRESHOLD: 0.7,
  IP_REPUTATION_CACHE_TTL: 3600, // 1 hour
} as const;

/**
 * Validate if a nonce is properly formatted
 */
export function isValidNonce(nonce: string): boolean {
  // Base64 encoded 16-byte nonce should be 24 characters
  return /^[A-Za-z0-9+/]{22}==$/.test(nonce) && nonce.length === 24;
}

/**
 * Generate Content Security Policy report URI
 */
export function getCSPReportURI(siteUrl: string): string {
  return `${siteUrl}/api/csp-report`;
}

/**
 * Sanitize user input for security headers
 */
export function sanitizeHeaderValue(value: string): string {
  // Remove potentially dangerous characters from header values
  return value.replace(/[\r\n\t]/g, '').trim();
}

/**
 * Check if request comes from a trusted source
 */
export function isTrustedOrigin(origin: string, trustedDomains: string[]): boolean {
  try {
    const url = new URL(origin);
    return trustedDomains.some((domain) => {
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}
