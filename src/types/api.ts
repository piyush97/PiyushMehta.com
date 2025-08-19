// Centralized API Types and Interfaces
// Provides type safety across the entire application

// Base API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
  field: string;
  value?: unknown;
}

// Newsletter Types
export interface NewsletterSubscription {
  email: string;
  source: string;
  referrer?: string;
  subscribed_at: string;
  confirmed: boolean;
}

export interface NewsletterMetrics {
  timeframe: '24h' | '7d' | '30d';
  totalSubscribers: number;
  newSubscribers: number;
  unsubscribes: number;
  growthRate: number;
  topSources?: Array<{
    source: string;
    count: number;
  }>;
}

// Comment System Types
export interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  post_slug: string;
  parent_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  content: string;
  author_name: string;
  author_email: string;
  post_slug: string;
  parent_id?: string;
}

// OG Image Types
export interface OGImageRequest {
  title: string;
  description?: string;
  template?: string;
  theme?: string;
  width?: number;
  height?: number;
}

// Security Types
export interface SecurityEvent {
  type: 'rate_limit' | 'csp_violation' | 'suspicious_activity';
  ip: string;
  user_agent: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface RateLimitInfo {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

// Performance Types
export interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database?: 'up' | 'down';
    redis?: 'up' | 'down';
    external_apis?: 'up' | 'down';
  };
  version: string;
}

// Generic Utility Types
export type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
