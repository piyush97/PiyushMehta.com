// Comment System Configuration
import type { CommentConfig } from '../types/comment';

// Environment-based configuration
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Default comment system configuration
export const defaultCommentConfig: CommentConfig = {
  // Core features
  enableReplies: true,
  enableLikes: true,
  enableEditing: false, // Disabled by default for security
  enableModeration: isProduction, // Auto-moderation in production

  // Structure limits
  maxNestingLevel: 3,
  maxCommentLength: 2000,
  minCommentLength: 5,

  // Approval settings
  requireApproval: isProduction, // Require approval in production
  allowGuestComments: true,

  // Security features
  spamProtection: true,
  rateLimiting: {
    enabled: true,
    maxCommentsPerHour: isDevelopment ? 100 : 10,
    maxCommentsPerDay: isDevelopment ? 1000 : 50,
  },
};

// Per-post configuration overrides
export const postCommentConfigs: Record<string, Partial<CommentConfig>> = {
  // Demo post with more lenient settings
  'demo-post-123': {
    enableReplies: true,
    enableLikes: true,
    enableEditing: true,
    enableModeration: false,
    requireApproval: false,
    maxNestingLevel: 5,
    rateLimiting: {
      enabled: false,
      maxCommentsPerHour: 1000,
      maxCommentsPerDay: 10000,
    },
  },

  // High-traffic posts might have stricter settings
  'viral-post': {
    requireApproval: true,
    enableModeration: true,
    rateLimiting: {
      enabled: true,
      maxCommentsPerHour: 5,
      maxCommentsPerDay: 20,
    },
  },

  // Technical posts might allow longer comments
  'technical-deep-dive': {
    maxCommentLength: 5000,
    minCommentLength: 10,
  },

  // Sensitive topics might disable features
  'controversial-topic': {
    enableReplies: false,
    enableLikes: false,
    requireApproval: true,
    enableModeration: true,
  },
};

// Get configuration for a specific post
export function getCommentConfig(postId: string): CommentConfig {
  const postOverrides = postCommentConfigs[postId] || {};
  return {
    ...defaultCommentConfig,
    ...postOverrides,
    // Merge rate limiting separately to avoid overwriting entire object
    rateLimiting: {
      ...defaultCommentConfig.rateLimiting,
      ...(postOverrides.rateLimiting || {}),
    },
  };
}

// Validation helpers
export function validateCommentConfig(config: CommentConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.maxNestingLevel < 0 || config.maxNestingLevel > 10) {
    errors.push('Max nesting level must be between 0 and 10');
  }

  if (config.minCommentLength < 1 || config.minCommentLength > 100) {
    errors.push('Min comment length must be between 1 and 100 characters');
  }

  if (config.maxCommentLength < config.minCommentLength || config.maxCommentLength > 10000) {
    errors.push('Max comment length must be greater than min length and less than 10000');
  }

  if (config.rateLimiting.enabled) {
    if (
      config.rateLimiting.maxCommentsPerHour < 1 ||
      config.rateLimiting.maxCommentsPerHour > 1000
    ) {
      errors.push('Max comments per hour must be between 1 and 1000');
    }

    if (config.rateLimiting.maxCommentsPerDay < config.rateLimiting.maxCommentsPerHour) {
      errors.push('Max comments per day must be greater than max comments per hour');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Feature flags for gradual rollout
export const commentFeatureFlags = {
  // Core features
  enableCommentSystem: true,
  enableRealtimeUpdates: false, // Future feature
  enableEmailNotifications: false, // Future feature
  enableMarkdownSupport: false, // Future feature
  enableFileUploads: false, // Future feature

  // Analytics and monitoring
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,

  // Experimental features
  enableAIModeration: false, // Future AI-powered moderation
  enableSentimentAnalysis: false, // Future sentiment analysis
  enableAutoTranslation: false, // Future auto-translation

  // Development features
  enableDebugMode: isDevelopment,
  enableMockData: isDevelopment,
  enableTestMode: isDevelopment,
};

// API endpoints configuration
export const commentApiConfig = {
  baseUrl: import.meta.env.PUBLIC_API_URL || '/api/trpc',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second

  // Cache settings
  cacheComments: true,
  cacheDuration: 5 * 60 * 1000, // 5 minutes

  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100,
};

// UI configuration
export const commentUIConfig = {
  // Theming
  respectSystemTheme: true,
  defaultTheme: 'dark' as 'light' | 'dark' | 'auto',

  // Animation settings
  enableAnimations: true,
  animationDuration: 300,

  // Responsive breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
  },

  // Avatar settings
  avatarSize: {
    small: 32,
    medium: 40,
    large: 48,
  },

  // Date formatting
  dateFormat: {
    locale: 'en-US',
    options: {
      timeZone: 'America/Toronto',
      dateStyle: 'medium' as const,
      timeStyle: 'short' as const,
    },
  },
};

// Security configuration
export const commentSecurityConfig = {
  // Content sanitization
  allowedTags: ['b', 'i', 'em', 'strong', 'code'],
  allowedAttributes: {},

  // Rate limiting
  rateLimitWindow: 60 * 60 * 1000, // 1 hour
  rateLimitMax: 10, // 10 comments per hour

  // Spam detection
  spamKeywords: [
    'viagra',
    'casino',
    'poker',
    'bitcoin',
    'crypto',
    'buy now',
    'click here',
    'free money',
    'make money',
  ],

  // Content validation
  maxUrlsPerComment: 2,
  maxConsecutiveChars: 10,
  minWordsPerComment: 2,

  // IP blocking (in production, this would come from a database)
  blockedIPs: [],

  // Email domain validation
  allowedEmailDomains: [], // Empty means all domains allowed
  blockedEmailDomains: ['tempmail.org', '10minutemail.com', 'guerrillamail.com'],
};

// Export all configurations
export const commentSystemConfig = {
  default: defaultCommentConfig,
  posts: postCommentConfigs,
  features: commentFeatureFlags,
  api: commentApiConfig,
  ui: commentUIConfig,
  security: commentSecurityConfig,
  getConfig: getCommentConfig,
  validateConfig: validateCommentConfig,
};
