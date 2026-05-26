/**
 * Security Middleware
 * Implements comprehensive security headers and policies for enhanced protection
 */

export interface SecurityOptions {
  csp?: {
    enabled?: boolean;
    reportOnly?: boolean;
    directives?: Record<string, string | string[]>;
  };
  hsts?: {
    enabled?: boolean;
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  crossOrigin?: {
    embedderPolicy?: string;
    openerPolicy?: string;
    resourcePolicy?: string;
  };
}

/**
 * Content Security Policy configuration
 * Aligned with current vercel.json configuration
 */
export const defaultCSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    '*.vercel-analytics.com',
    '*.sentry.io',
    'giscus.app',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', '*.githubusercontent.com'],
  'font-src': ["'self'", 'fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    '*.sentry.io',
    '*.vercel-analytics.com',
    'giscus.app',
    'api.github.com',
  ],
  'frame-src': ['giscus.app', 'https://www.youtube-nocookie.com'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

/**
 * Generate CSP header value from directives
 */
export function generateCSPHeader(
  directives: Record<string, string | string[]> = defaultCSPDirectives
): string {
  return `${Object.entries(directives)
    .map(([directive, sources]) => {
      const sourceList = Array.isArray(sources) ? sources.join(' ') : sources;
      return `${directive} ${sourceList}`;
    })
    .join('; ')};`;
}

/**
 * Security headers configuration
 * Matches current vercel.json setup for consistency
 */
export const securityHeaders = {
  // Content type protection
  'X-Content-Type-Options': 'nosniff',

  // Frame protection
  'X-Frame-Options': 'DENY',

  // XSS protection (legacy support)
  'X-XSS-Protection': '1; mode=block',

  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',

  // Additional security headers
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
} as const;

/**
 * HSTS (HTTP Strict Transport Security) configuration
 */
export function generateHSTSHeader(
  options: { maxAge?: number; includeSubDomains?: boolean; preload?: boolean } = {}
): string {
  const {
    maxAge = 31536000, // 1 year
    includeSubDomains = true,
    preload = true,
  } = options;

  let header = `max-age=${maxAge}`;
  if (includeSubDomains) header += '; includeSubDomains';
  if (preload) header += '; preload';

  return header;
}

/**
 * Cross-Origin headers for additional protection
 */
export const crossOriginHeaders = {
  // Prevent embedding in cross-origin contexts
  'Cross-Origin-Embedder-Policy': 'require-corp',

  // Prevent cross-origin window references
  'Cross-Origin-Opener-Policy': 'same-origin',

  // Control cross-origin resource sharing
  'Cross-Origin-Resource-Policy': 'same-site',
} as const;

/**
 * Get security headers for different environments
 */
export function getSecurityHeaders(options: SecurityOptions = {}): Record<string, string> {
  const headers: Record<string, string> = { ...securityHeaders };

  // Add HSTS for production HTTPS
  if (options.hsts?.enabled !== false) {
    headers['Strict-Transport-Security'] = generateHSTSHeader(options.hsts);
  }

  // Add Cross-Origin headers if enabled
  if (options.crossOrigin) {
    const { embedderPolicy, openerPolicy, resourcePolicy } = options.crossOrigin;

    if (embedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = embedderPolicy;
    }
    if (openerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = openerPolicy;
    }
    if (resourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = resourcePolicy;
    }
  }

  // Custom CSP if provided
  if (options.csp?.directives) {
    headers['Content-Security-Policy'] = generateCSPHeader(options.csp.directives);
  }

  // CSP Report-Only mode for testing
  if (options.csp?.reportOnly) {
    headers['Content-Security-Policy-Report-Only'] = headers['Content-Security-Policy'];
    return Object.fromEntries(
      Object.entries(headers).filter(([name]) => name !== 'Content-Security-Policy')
    );
  }

  return headers;
}

/**
 * Security configuration presets
 */
export const securityPresets = {
  // Basic security (default)
  basic: (): Record<string, string> => getSecurityHeaders(),

  // Enhanced security with cross-origin protection
  enhanced: (): Record<string, string> =>
    getSecurityHeaders({
      crossOrigin: {
        embedderPolicy: 'require-corp',
        openerPolicy: 'same-origin',
        resourcePolicy: 'same-site',
      },
    }),

  // Development preset (more permissive)
  development: (): Record<string, string> =>
    getSecurityHeaders({
      csp: {
        directives: {
          ...defaultCSPDirectives,
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'", // More permissive for dev
            '*.vercel-analytics.com',
            '*.sentry.io',
            'giscus.app',
            'localhost:*',
            '127.0.0.1:*',
          ],
          'connect-src': [
            "'self'",
            '*.sentry.io',
            '*.vercel-analytics.com',
            'giscus.app',
            'api.github.com',
            'localhost:*',
            'ws://localhost:*', // WebSocket for dev server
            'wss://localhost:*',
          ],
        },
      },
      hsts: { enabled: false }, // No HSTS in development
    }),

  // Production preset (strict)
  production: (): Record<string, string> =>
    getSecurityHeaders({
      hsts: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
      },
      crossOrigin: {
        embedderPolicy: 'require-corp',
        openerPolicy: 'same-origin',
        resourcePolicy: 'same-site',
      },
    }),
} as const;

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check CSP configuration
  const cspHeader = securityHeaders['Content-Security-Policy'];
  if (!cspHeader.includes("'unsafe-eval'")) {
    warnings.push("CSP does not include 'unsafe-eval' - may affect some development tools");
  }

  if (cspHeader.includes("'unsafe-inline'")) {
    warnings.push(
      "CSP includes 'unsafe-inline' - consider using nonces or hashes for better security"
    );
  }

  // Check frame protection
  if (
    securityHeaders['X-Frame-Options'] !== 'DENY' &&
    !cspHeader.includes("frame-ancestors 'none'")
  ) {
    errors.push('Neither X-Frame-Options nor CSP frame-ancestors properly configured');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Development utilities
 */
export const devSecurity = {
  // Check current headers
  checkHeaders: () => getSecurityHeaders(),

  // Validate configuration
  validate: () => validateSecurityConfig(),

  // Test CSP directives
  testCSP: (directives: Record<string, string | string[]>) => {
    return generateCSPHeader(directives);
  },

  // Generate report for debugging
  generateReport: () => ({
    timestamp: new Date().toISOString(),
    headers: getSecurityHeaders(),
    validation: validateSecurityConfig(),
    environment: process.env.NODE_ENV || 'development',
  }),
};

/**
 * Production security monitoring
 */
export const prodSecurity = {
  // Monitor for security header presence
  monitor: async (url: string) => {
    // Would integrate with monitoring services
    console.log(`Security monitoring for: ${url}`);
  },

  // Generate security report
  report: () => ({
    ...devSecurity.generateReport(),
    preset: 'production',
    hsts: true,
    crossOrigin: true,
  }),

  // Health check
  healthCheck: () => {
    const validation = validateSecurityConfig();
    return {
      status: validation.valid ? 'healthy' : 'warning',
      details: validation,
    };
  },
};

/**
 * Export main security configuration
 */
export default {
  headers: securityHeaders,
  getHeaders: getSecurityHeaders,
  presets: securityPresets,
  validate: validateSecurityConfig,
  dev: devSecurity,
  prod: prodSecurity,
};
