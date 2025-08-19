// Comment API service layer
import type {
  Comment,
  CommentConfig,
  CommentLikeRequest,
  CommentListResponse,
  CommentModerationRequest,
  CommentQueryParams,
  CommentResponse,
  CommentStatsResponse,
  CommentSubmissionRequest,
  CommentUpdateRequest,
  SpamDetectionResult,
} from '../types/comment';

// Base API configuration
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || '/api/trpc';
const API_ENDPOINTS = {
  comments: `${API_BASE_URL}/comments`,
  like: `${API_BASE_URL}/comments`,
  moderate: `${API_BASE_URL}/comments`,
  stats: `${API_BASE_URL}/comments`,
  config: `${API_BASE_URL}/comments`,
  spam: `${API_BASE_URL}/comments`,
} as const;

// API client with error handling and retry logic
class CommentApiClient {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Get comments for a post
  async getComments(params: CommentQueryParams): Promise<CommentListResponse> {
    const queryString = new URLSearchParams({
      postId: params.postId,
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.filter && { filter: params.filter }),
      ...(params.parentId && { parentId: params.parentId }),
    });

    return this.makeRequest<CommentListResponse>(`${API_ENDPOINTS.comments}?${queryString}`, {
      method: 'GET',
    });
  }

  // Submit a new comment
  async submitComment(request: CommentSubmissionRequest): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(API_ENDPOINTS.comments, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update an existing comment
  async updateComment(request: CommentUpdateRequest): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(`${API_ENDPOINTS.comments}/${request.commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: request.content }),
    });
  }

  // Delete a comment
  async deleteComment(commentId: string): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(`${API_ENDPOINTS.comments}/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Like or unlike a comment
  async likeComment(request: CommentLikeRequest): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(API_ENDPOINTS.like, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Moderate a comment (admin only)
  async moderateComment(request: CommentModerationRequest): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(API_ENDPOINTS.moderate, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get comment statistics
  async getCommentStats(postId?: string): Promise<CommentStatsResponse> {
    const queryString = postId ? `?postId=${postId}` : '';
    return this.makeRequest<CommentStatsResponse>(`${API_ENDPOINTS.stats}${queryString}`, {
      method: 'GET',
    });
  }

  // Get comment system configuration
  async getConfig(): Promise<CommentConfig> {
    return this.makeRequest<CommentConfig>(API_ENDPOINTS.config, {
      method: 'GET',
    });
  }

  // Check if content is spam
  async checkSpam(
    content: string,
    author: { name: string; email: string }
  ): Promise<SpamDetectionResult> {
    return this.makeRequest<SpamDetectionResult>(API_ENDPOINTS.spam, {
      method: 'POST',
      body: JSON.stringify({ content, author }),
    });
  }
}

// Create singleton instance
export const commentApi = new CommentApiClient();

// Helper functions for common operations
export const CommentService = {
  // Build comment tree from flat list
  buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment & { replies: Comment[] }>();
    const rootComments: (Comment & { replies: Comment[] })[] = [];

    // First pass: create map of all comments with replies array
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  },

  // Format relative time
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  },

  // Generate consistent avatar URL
  generateAvatarUrl(name: string, email: string): string {
    // Use a deterministic hash to generate consistent avatars
    const hash = email.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    // Use initials-based avatar service
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const colors = ['3b82f6', '8b5cf6', 'ef4444', '10b981', 'f59e0b', 'ec4899'];
    const colorIndex = Math.abs(hash) % colors.length;

    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&backgroundColor=${colors[colorIndex]}&color=ffffff`;
  },

  // Validate comment content
  validateComment(content: string, config: CommentConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      errors.push('Comment cannot be empty');
    }

    if (trimmedContent.length < config.minCommentLength) {
      errors.push(`Comment must be at least ${config.minCommentLength} characters long`);
    }

    if (trimmedContent.length > config.maxCommentLength) {
      errors.push(`Comment must be less than ${config.maxCommentLength} characters long`);
    }

    // Basic spam detection patterns
    const spamPatterns = [
      /http[s]?:\/\/[^\s]{3,}/gi, // Multiple URLs
      /(.)\1{10,}/gi, // Repeated characters
      /^[A-Z\s!]{20,}$/gi, // All caps
    ];

    spamPatterns.forEach((pattern) => {
      if (pattern.test(trimmedContent)) {
        errors.push('Comment appears to be spam');
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Sanitize comment content
  sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/[<>'"&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return escapeMap[match] || match;
      })
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
  },

  // Extract URLs from content
  extractUrls(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return content.match(urlRegex) || [];
  },

  // Calculate comment engagement score
  calculateEngagementScore(comment: Comment, replies: Comment[] = []): number {
    const likeWeight = 1;
    const replyWeight = 2;
    const timeDecay = Math.max(
      0.1,
      1 - (Date.now() - comment.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ); // 30 day decay

    return (comment.likes * likeWeight + replies.length * replyWeight) * timeDecay;
  },

  // Get comment statistics
  getCommentMetrics(comments: Comment[]): {
    total: number;
    approved: number;
    pending: number;
    totalLikes: number;
    averageLikes: number;
    engagementRate: number;
  } {
    const total = comments.length;
    const approved = comments.filter((c) => c.status === 'approved').length;
    const pending = comments.filter((c) => c.status === 'pending').length;
    const totalLikes = comments.reduce((sum, c) => sum + c.likes, 0);
    const averageLikes = total > 0 ? totalLikes / total : 0;
    const engagementRate = total > 0 ? (totalLikes / total) * 100 : 0;

    return {
      total,
      approved,
      pending,
      totalLikes,
      averageLikes,
      engagementRate,
    };
  },
};

// Export types for convenience
export type {
  Comment,
  CommentSubmissionRequest,
  CommentResponse,
  CommentListResponse,
  CommentQueryParams,
  CommentConfig,
};
