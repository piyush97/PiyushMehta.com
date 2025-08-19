import React, { useCallback, useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';
import type { Comment, CommentFormData } from '../types/comment';
import { captureError, captureMessage } from '../utils/sentry-client';
import { withErrorBoundary } from './ErrorBoundary';

// Comment interfaces imported from types/comment.ts

// Component props interface
export interface CommentSystemProps {
  /** Post ID or article identifier */
  postId: string;
  /** Custom CSS classes */
  className?: string;
  /** Maximum nesting level for replies */
  maxNestingLevel?: number;
  /** Enable/disable reply functionality */
  allowReplies?: boolean;
  /** Enable/disable like functionality */
  allowLikes?: boolean;
  /** Enable/disable editing of comments */
  allowEditing?: boolean;
  /** Moderation mode - comments require approval */
  moderationEnabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Comment loading state callback */
  onCommentsLoad?: (comments: Comment[]) => void;
  /** Comment submission callback */
  onCommentSubmit?: (
    comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked' | 'status'>
  ) => void;
}

// CommentFormData imported from types

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  initialData?: Partial<CommentFormData>;
  isSubmitting?: boolean;
}

// Individual comment form component
const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = 'Share your thoughts...',
  isReply = false,
  initialData = {},
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CommentFormData>({
    name: '',
    email: '',
    website: '',
    content: '',
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Comment cannot be empty';
    } else if (formData.content.trim().length < 5) {
      newErrors.content = 'Comment must be at least 5 characters long';
    } else if (formData.content.trim().length > 2000) {
      newErrors.content = 'Comment must be less than 2000 characters';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must be a valid URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        content: formData.content.trim(),
      });

      // Clear form after successful submission (except for user info)
      setFormData({
        ...formData,
        content: '',
      });
      setErrors({});
    } catch (error) {
      captureError(error as Error, { context: 'comment_form_submission' });
      setErrors({ submit: 'Failed to submit comment. Please try again.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
              focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
              ${errors.name ? 'border-red-500' : 'border-card-border'}`}
            placeholder="Your name"
            disabled={isSubmitting}
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
              focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
              ${errors.email ? 'border-red-500' : 'border-card-border'}`}
            placeholder="your@email.com"
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-text-secondary mt-1">Your email won't be published</p>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-text-primary mb-1">
          Website (optional)
        </label>
        <input
          type="url"
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
            focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
            ${errors.website ? 'border-red-500' : 'border-card-border'}`}
          placeholder="https://yourwebsite.com"
          disabled={isSubmitting}
        />
        {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-text-primary mb-1">
          {isReply ? 'Reply' : 'Comment'} *
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={isReply ? 3 : 5}
          className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
            focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-y
            ${errors.content ? 'border-red-500' : 'border-card-border'}`}
          placeholder={placeholder}
          disabled={isSubmitting}
          required
        />
        <div className="flex justify-between items-center mt-1">
          {errors.content && <p className="text-red-500 text-xs">{errors.content}</p>}
          <p className="text-xs text-text-secondary ml-auto">
            {formData.content.length}/2000 characters
          </p>
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !formData.content.trim()}
          className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : isReply ? 'Post Reply' : 'Post Comment'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// Individual comment item component
interface CommentItemProps {
  comment: Comment;
  onReply?: (parentId: string) => void;
  onLike?: (commentId: string) => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  allowReplies?: boolean;
  allowLikes?: boolean;
  allowEditing?: boolean;
  nestingLevel?: number;
  maxNestingLevel?: number;
  replies?: Comment[];
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onEdit,
  onDelete,
  allowReplies = true,
  allowLikes = true,
  allowEditing = false,
  nestingLevel = 0,
  maxNestingLevel = 3,
  replies = [],
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const canReply = allowReplies && nestingLevel < maxNestingLevel;

  const handleReply = () => {
    if (canReply && onReply) {
      setShowReplyForm(true);
    }
  };

  const handleReplySubmit = async (formData: CommentFormData) => {
    // This would typically make an API call
    if (import.meta.env.DEV) {
      console.log('Reply submitted:', formData);
    }
    setShowReplyForm(false);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getAvatarUrl = (email: string, name: string): string => {
    // Simple hash function for consistent avatar generation
    const hash = email.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const _avatarIndex = (Math.abs(hash) % 6) + 1;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6`;
  };

  return (
    <div
      className={`comment-item ${nestingLevel > 0 ? 'ml-8 border-l-2 border-card-border pl-4' : ''}`}
    >
      <div className="flex gap-3 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={comment.author.avatar || getAvatarUrl(comment.author.email, comment.author.name)}
            alt={`${comment.author.name}'s avatar`}
            className="w-10 h-10 rounded-full bg-light-700"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Comment header */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-text-primary">
              {comment.author.website ? (
                <a
                  href={comment.author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {comment.author.name}
                </a>
              ) : (
                comment.author.name
              )}
            </h4>
            <span className="text-sm text-text-secondary">{formatDate(comment.timestamp)}</span>
            {comment.isEdited && (
              <span className="text-xs text-text-secondary italic">(edited)</span>
            )}
            {comment.status === 'pending' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Pending approval
              </span>
            )}
          </div>

          {/* Comment content */}
          <div className="prose prose-sm max-w-none text-text-primary mb-3">
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Comment actions */}
          <div className="flex items-center gap-4 text-sm">
            {allowLikes && (
              <button
                type="button"
                onClick={() => onLike?.(comment.id)}
                className={`flex items-center gap-1 transition-colors ${
                  comment.isLiked ? 'text-accent' : 'text-text-secondary hover:text-accent'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill={comment.isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{comment.likes}</span>
              </button>
            )}

            {canReply && (
              <button
                type="button"
                onClick={handleReply}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                Reply
              </button>
            )}

            {allowEditing && (
              <button
                type="button"
                onClick={() => onEdit?.(comment.id)}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-4 p-4 bg-light-800 rounded-lg border border-card-border">
              <CommentForm
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${comment.author.name}...`}
                isReply={true}
              />
            </div>
          )}

          {/* Nested replies */}
          {replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  allowReplies={allowReplies}
                  allowLikes={allowLikes}
                  allowEditing={allowEditing}
                  nestingLevel={nestingLevel + 1}
                  maxNestingLevel={maxNestingLevel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main comment system component
const CommentSystem: React.FC<CommentSystemProps> = ({
  postId,
  className = '',
  maxNestingLevel = 3,
  allowReplies = true,
  allowLikes = true,
  allowEditing = false,
  moderationEnabled = false,
  placeholder = 'Share your thoughts about this post...',
  onCommentsLoad,
  onCommentSubmit,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  // Load comments on component mount
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);

        // Use real tRPC to fetch comments
        const response = await trpc.comments.getComments.query({
          postId,
          page: 1,
          limit: 50,
          sortBy,
          filter: 'all',
        });

        if (response.success) {
          setComments(response.comments);
          onCommentsLoad?.(response.comments);
        } else {
          throw new Error('Failed to load comments');
        }
      } catch (error) {
        captureError(error as Error, { context: 'comment_loading', postId });
        setComments([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [postId, sortBy, onCommentsLoad]);

  const handleCommentSubmit = async (formData: CommentFormData) => {
    try {
      setIsSubmitting(true);

      // Use real tRPC to submit comment
      const response = await trpc.comments.submitComment.mutate({
        postId,
        author: {
          name: formData.name,
          email: formData.email,
          website: formData.website,
        },
        content: formData.content,
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        },
      });

      if (response.success && response.comment) {
        // Add new comment to the top of the list
        setComments((prev) => [response.comment!, ...prev]);
        onCommentSubmit?.(formData);

        captureMessage('Comment submitted successfully', 'info', {
          postId,
          commentId: response.comment.id,
          status: response.comment.status,
        });
      } else {
        throw new Error(response.message || 'Failed to submit comment');
      }
    } catch (error) {
      captureError(error as Error, { context: 'comment_submission', postId });
      throw error; // Re-throw to let form handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    // Find the current comment to determine like action
    const currentComment = comments.find((c) => c.id === commentId);
    if (!currentComment) return;

    const action = currentComment.isLiked ? 'unlike' : 'like';

    // Optimistic update
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );

    try {
      // Use real tRPC to update like
      const response = await trpc.comments.likeComment.mutate({
        commentId,
        action,
      });

      if (response.success && response.comment) {
        // Update with actual server response
        setComments((prev) =>
          prev.map((comment) => (comment.id === commentId ? response.comment! : comment))
        );
      } else {
        throw new Error(response.message || 'Failed to update like');
      }
    } catch (error) {
      captureError(error as Error, { context: 'comment_like', commentId });
      // Revert optimistic update on error
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes + 1 : comment.likes - 1,
              }
            : comment
        )
      );
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.timestamp.getTime() - b.timestamp.getTime();
      case 'popular':
        return b.likes - a.likes;
      case 'newest':
      default:
        return b.timestamp.getTime() - a.timestamp.getTime();
    }
  });

  if (isLoading) {
    return (
      <div className={`comment-system ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`comment-system ${className}`}>
      {/* Comment form */}
      <div className="bg-gradient-card border border-card-border p-6 rounded-lg mb-8">
        <h3 className="text-xl font-bold text-text-primary mb-4">Leave a Comment</h3>
        <CommentForm
          onSubmit={handleCommentSubmit}
          placeholder={placeholder}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {/* Comments header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-primary">Comments ({comments.length})</h3>

          {comments.length > 1 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
              className="px-3 py-1 text-sm border border-card-border rounded-lg bg-light-800 text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="popular">Most popular</option>
            </select>
          )}
        </div>

        {/* Comments */}
        {sortedComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLike}
                allowReplies={allowReplies}
                allowLikes={allowLikes}
                allowEditing={allowEditing}
                maxNestingLevel={maxNestingLevel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Export wrapped component with error boundary
export const WrappedCommentSystem = withErrorBoundary(CommentSystem);
export { WrappedCommentSystem as CommentSystem };
