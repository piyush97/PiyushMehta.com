// Comment system type definitions
export interface CommentAuthor {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  website?: string;
  isVerified?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: CommentAuthor;
  content: string;
  timestamp: Date;
  parentId?: string; // For nested replies
  likes: number;
  isLiked: boolean;
  isEdited: boolean;
  editedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  };
}

export interface CommentThread {
  comment: Comment;
  replies: CommentThread[];
  totalReplies: number;
}

export interface CommentFormData {
  name: string;
  email: string;
  website?: string;
  content: string;
  parentId?: string;
}

export interface CommentSubmissionRequest {
  postId: string;
  author: Omit<CommentAuthor, 'id' | 'isVerified'>;
  content: string;
  parentId?: string;
  metadata?: {
    userAgent: string;
    referrer: string;
  };
}

export interface CommentUpdateRequest {
  commentId: string;
  content: string;
}

export interface CommentModerationRequest {
  commentId: string;
  action: 'approve' | 'reject' | 'spam';
  reason?: string;
}

export interface CommentLikeRequest {
  commentId: string;
  action: 'like' | 'unlike';
}

// API Response types
export interface CommentResponse {
  success: boolean;
  comment?: Comment;
  message?: string;
  errors?: Record<string, string>;
}

export interface CommentListResponse {
  success: boolean;
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CommentStatsResponse {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  spam: number;
}

// Configuration types
export interface CommentConfig {
  enableReplies: boolean;
  enableLikes: boolean;
  enableEditing: boolean;
  enableModeration: boolean;
  maxNestingLevel: number;
  maxCommentLength: number;
  minCommentLength: number;
  requireApproval: boolean;
  allowGuestComments: boolean;
  spamProtection: boolean;
  rateLimiting: {
    enabled: boolean;
    maxCommentsPerHour: number;
    maxCommentsPerDay: number;
  };
}

// Event types for real-time updates
export interface CommentEvent {
  type:
    | 'comment_added'
    | 'comment_updated'
    | 'comment_deleted'
    | 'comment_liked'
    | 'comment_moderated';
  postId: string;
  commentId: string;
  comment?: Comment;
  userId?: string;
  timestamp: Date;
}

// Sorting and filtering options
export type CommentSortBy = 'newest' | 'oldest' | 'popular' | 'controversial';
export type CommentFilter = 'all' | 'approved' | 'pending' | 'replies_only';

export interface CommentQueryParams {
  postId: string;
  page?: number;
  limit?: number;
  sortBy?: CommentSortBy;
  filter?: CommentFilter;
  parentId?: string;
}

// Analytics types
export interface CommentAnalytics {
  totalComments: number;
  totalReplies: number;
  totalLikes: number;
  averageCommentsPerPost: number;
  topCommenters: Array<{
    author: CommentAuthor;
    commentCount: number;
  }>;
  engagementMetrics: {
    likeRate: number;
    replyRate: number;
    approvalRate: number;
  };
  timeMetrics: {
    averageResponseTime: number;
    peakCommentingHours: number[];
    commentTrends: Array<{
      date: string;
      count: number;
    }>;
  };
}

// Validation schemas (can be used with libraries like Yup or Zod)
export interface CommentValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
  website: {
    required: boolean;
    pattern?: RegExp;
  };
  content: {
    required: boolean;
    minLength: number;
    maxLength: number;
    forbiddenWords?: string[];
  };
}

// Security and spam protection
export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  action: 'allow' | 'moderate' | 'block';
}

export interface CommentSecurityContext {
  ipAddress: string;
  userAgent: string;
  referrer: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}
