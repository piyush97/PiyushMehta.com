// Comment system tRPC router with Supabase integration
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import type {
  Comment,
  CommentListResponse,
  CommentResponse,
  CommentStatsResponse,
  CommentSubmissionRequest,
} from '../../types/comment';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Input validation schemas
const commentSubmissionSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  author: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email address').max(255, 'Email too long'),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  }),
  content: z.string().min(5, 'Comment too short').max(2000, 'Comment too long'),
  parentId: z.string().optional(),
  metadata: z
    .object({
      userAgent: z.string(),
      referrer: z.string(),
    })
    .optional(),
});

const commentQuerySchema = z.object({
  postId: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['newest', 'oldest', 'popular']).default('newest'),
  filter: z.enum(['all', 'approved', 'pending', 'replies_only']).default('all'),
  parentId: z.string().optional(),
});

const commentLikeSchema = z.object({
  commentId: z.string().min(1),
  action: z.enum(['like', 'unlike']),
});

const commentModerationSchema = z.object({
  commentId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'spam']),
  reason: z.string().optional(),
});

// Database helper functions
async function mapDbCommentToComment(dbComment: any): Promise<Comment> {
  return {
    id: dbComment.id,
    postId: dbComment.post_id,
    author: {
      name: dbComment.author_name,
      email: dbComment.author_email,
      website: dbComment.author_website || undefined,
    },
    content: dbComment.content,
    timestamp: new Date(dbComment.created_at),
    parentId: dbComment.parent_id || undefined,
    likes: dbComment.likes || 0,
    isLiked: false, // Will be determined by user context
    isEdited: dbComment.is_edited || false,
    editedAt: dbComment.edited_at ? new Date(dbComment.edited_at) : undefined,
    status: dbComment.status as 'pending' | 'approved' | 'rejected',
  };
}

function sanitizeContent(content: string): string {
  return content.trim().replace(/[<>'"&]/g, (match) => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return escapeMap[match] || match;
  });
}

function isSpam(content: string, author: { name: string; email: string }): boolean {
  const spamPatterns = [
    /http[s]?:\/\/[^\s]{3,}/gi, // Multiple URLs
    /(.)\1{10,}/gi, // Repeated characters
    /^[A-Z\s!]{20,}$/gi, // All caps
    /viagra|casino|poker|bitcoin|crypto/gi, // Common spam words
  ];

  const contentLower = content.toLowerCase();
  return (
    spamPatterns.some((pattern) => pattern.test(contentLower)) ||
    author.name.toLowerCase().includes('admin') ||
    author.email.includes('test')
  );
}

// Create the comments router
export const commentsRouter = createTRPCRouter({
  // Get comments for a post
  getComments: publicProcedure
    .input(commentQuerySchema)
    .query(async ({ input }): Promise<CommentListResponse> => {
      try {
        const { postId, page, limit, sortBy, filter, parentId } = input;

        // Build query
        let query = supabase
          .from('comments')
          .select(`
            id,
            post_id,
            author_name,
            author_email,
            author_website,
            content,
            status,
            parent_id,
            likes,
            is_edited,
            edited_at,
            created_at
          `)
          .eq('post_id', postId);

        // Apply filters
        switch (filter) {
          case 'approved':
            query = query.eq('status', 'approved');
            break;
          case 'pending':
            query = query.eq('status', 'pending');
            break;
          case 'replies_only':
            query = query.not('parent_id', 'is', null);
            break;
          case 'all':
          default:
            query = query.not('status', 'in', '(rejected,spam)');
            break;
        }

        // Filter by parent ID if specified
        if (parentId) {
          query = query.eq('parent_id', parentId);
        }

        // Apply sorting
        switch (sortBy) {
          case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
          case 'popular':
            query = query.order('likes', { ascending: false });
            break;
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        // Get total count for pagination
        const countQuery = supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (filter === 'approved') {
          countQuery.eq('status', 'approved');
        } else if (filter !== 'all') {
          countQuery.not('status', 'in', '(rejected,spam)');
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        query = query.range(startIndex, startIndex + limit - 1);

        // Execute queries
        const [{ data: comments, error: commentsError }, { count, error: countError }] =
          await Promise.all([query, countQuery]);

        if (commentsError) {
          if (import.meta.env.DEV) {
            console.error('Error fetching comments:', commentsError);
          }
          throw new Error('Failed to fetch comments');
        }

        if (countError) {
          if (import.meta.env.DEV) {
            console.error('Error fetching comment count:', countError);
          }
          throw new Error('Failed to fetch comment count');
        }

        // Map database comments to Comment interface
        const mappedComments = await Promise.all((comments || []).map(mapDbCommentToComment));

        return {
          success: true,
          comments: mappedComments,
          total: count || 0,
          page,
          limit,
          hasMore: startIndex + limit < (count || 0),
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching comments:', error);
        }
        throw new Error('Failed to fetch comments');
      }
    }),

  // Submit a new comment
  submitComment: publicProcedure
    .input(commentSubmissionSchema)
    .mutation(async ({ input, ctx }): Promise<CommentResponse> => {
      try {
        const { postId, author, content, parentId, metadata } = input;

        // Sanitize content
        const sanitizedContent = sanitizeContent(content);

        // Check for spam
        const isSpamComment = isSpam(sanitizedContent, author);

        // Calculate spam score
        const spamScore = isSpamComment ? 0.8 : 0.1;

        // Determine status based on spam check and moderation settings
        const status = isSpamComment ? 'pending' : 'approved';

        // Insert comment into database
        const { data: newComment, error } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            user_id: null, // Will be updated when we have user context
            author_name: author.name,
            author_email: author.email,
            author_website: author.website || null,
            content: sanitizedContent,
            status,
            parent_id: parentId || null,
            likes: 0,
            is_edited: false,
            ip_address: ctx?.ip || '127.0.0.1',
            user_agent: metadata?.userAgent || ctx?.userAgent || 'Unknown',
            referrer: metadata?.referrer || ctx?.headers?.get?.('referer') || null,
            spam_score: spamScore,
          })
          .select()
          .single();

        if (error) {
          if (import.meta.env.DEV) {
            console.error('Error inserting comment:', error);
          }
          return {
            success: false,
            message: 'Failed to submit comment. Please try again.',
            errors: { submit: 'Database error' },
          };
        }

        // Map to Comment interface
        const mappedComment = await mapDbCommentToComment(newComment);

        return {
          success: true,
          comment: mappedComment,
          message: isSpamComment
            ? 'Comment submitted and is pending moderation.'
            : 'Comment posted successfully!',
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error submitting comment:', error);
        }
        return {
          success: false,
          message: 'Failed to submit comment. Please try again.',
          errors: { submit: 'Internal server error' },
        };
      }
    }),

  // Like or unlike a comment
  likeComment: publicProcedure
    .input(commentLikeSchema)
    .mutation(async ({ input, ctx }): Promise<CommentResponse> => {
      try {
        const { commentId, action } = input;

        // Get IP address for anonymous likes
        const ipAddress = ctx?.ip || '127.0.0.1';

        // Use database function for safe like/unlike
        const functionName =
          action === 'like' ? 'increment_comment_likes' : 'decrement_comment_likes';

        const { data: _newLikes, error: likeError } = await supabase.rpc(functionName, {
          comment_id_param: commentId,
          user_ip: ipAddress,
        });

        if (likeError) {
          if (import.meta.env.DEV) {
            console.error('Error updating comment like:', likeError);
          }
          return {
            success: false,
            message: 'Failed to update like. Please try again.',
          };
        }

        // Get updated comment
        const { data: updatedComment, error: commentError } = await supabase
          .from('comments')
          .select(`
            id,
            post_id,
            author_name,
            author_email,
            author_website,
            content,
            status,
            parent_id,
            likes,
            is_edited,
            edited_at,
            created_at
          `)
          .eq('id', commentId)
          .single();

        if (commentError || !updatedComment) {
          return {
            success: false,
            message: 'Comment not found',
          };
        }

        // Map to Comment interface
        const mappedComment = await mapDbCommentToComment(updatedComment);

        return {
          success: true,
          comment: mappedComment,
          message: action === 'like' ? 'Comment liked!' : 'Like removed',
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error updating comment like:', error);
        }
        return {
          success: false,
          message: 'Failed to update like. Please try again.',
        };
      }
    }),

  // Moderate a comment (admin function)
  moderateComment: publicProcedure
    .input(commentModerationSchema)
    .mutation(async ({ input }): Promise<CommentResponse> => {
      try {
        const { commentId, action, reason } = input;

        // Map action to status
        let status: string;
        switch (action) {
          case 'approve':
            status = 'approved';
            break;
          case 'reject':
            status = 'rejected';
            break;
          case 'spam':
            status = 'spam';
            break;
          default:
            return {
              success: false,
              message: 'Invalid moderation action',
            };
        }

        // Update comment status in database
        const { data: updatedComment, error } = await supabase
          .from('comments')
          .update({
            status,
            moderated_at: new Date().toISOString(),
            moderation_reason: reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', commentId)
          .select(`
            id,
            post_id,
            author_name,
            author_email,
            author_website,
            content,
            status,
            parent_id,
            likes,
            is_edited,
            edited_at,
            created_at
          `)
          .single();

        if (error || !updatedComment) {
          if (import.meta.env.DEV) {
            console.error('Error updating comment status:', error);
          }
          return {
            success: false,
            message: 'Comment not found or update failed',
          };
        }

        // Map to Comment interface
        const mappedComment = await mapDbCommentToComment(updatedComment);

        return {
          success: true,
          comment: mappedComment,
          message: `Comment ${action}ed successfully`,
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error moderating comment:', error);
        }
        return {
          success: false,
          message: 'Failed to moderate comment',
        };
      }
    }),

  // Get comment statistics
  getStats: publicProcedure
    .input(
      z.object({
        postId: z.string().optional(),
      })
    )
    .query(async ({ input }): Promise<CommentStatsResponse> => {
      try {
        const { postId } = input;

        // Build base query
        let query = supabase.from('comments').select('status');

        // Filter by post if specified
        if (postId) {
          query = query.eq('post_id', postId);
        }

        const { data: comments, error } = await query;

        if (error) {
          if (import.meta.env.DEV) {
            console.error('Error fetching comment stats:', error);
          }
          throw new Error('Failed to fetch comment statistics');
        }

        // Calculate statistics
        const total = comments?.length || 0;
        const approved = comments?.filter((c) => c.status === 'approved').length || 0;
        const pending = comments?.filter((c) => c.status === 'pending').length || 0;
        const rejected = comments?.filter((c) => c.status === 'rejected').length || 0;
        const spam = comments?.filter((c) => c.status === 'spam').length || 0;

        return {
          total,
          approved,
          pending,
          rejected,
          spam,
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching comment stats:', error);
        }
        throw new Error('Failed to fetch comment statistics');
      }
    }),

  // Delete a comment
  deleteComment: publicProcedure
    .input(
      z.object({
        commentId: z.string().min(1),
      })
    )
    .mutation(async ({ input }): Promise<CommentResponse> => {
      try {
        const { commentId } = input;

        // Check if comment exists
        const { data: existingComment, error: checkError } = await supabase
          .from('comments')
          .select('id')
          .eq('id', commentId)
          .single();

        if (checkError || !existingComment) {
          return {
            success: false,
            message: 'Comment not found',
          };
        }

        // Delete replies first (foreign key constraint)
        const { error: repliesError } = await supabase
          .from('comments')
          .delete()
          .eq('parent_id', commentId);

        if (repliesError) {
          if (import.meta.env.DEV) {
            console.error('Error deleting comment replies:', repliesError);
          }
          return {
            success: false,
            message: 'Failed to delete comment replies',
          };
        }

        // Delete the comment
        const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);

        if (deleteError) {
          if (import.meta.env.DEV) {
            console.error('Error deleting comment:', deleteError);
          }
          return {
            success: false,
            message: 'Failed to delete comment',
          };
        }

        return {
          success: true,
          message: 'Comment deleted successfully',
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error deleting comment:', error);
        }
        return {
          success: false,
          message: 'Failed to delete comment',
        };
      }
    }),

  // Update comment content
  updateComment: publicProcedure
    .input(
      z.object({
        commentId: z.string().min(1),
        content: z.string().min(5).max(2000),
      })
    )
    .mutation(async ({ input }): Promise<CommentResponse> => {
      try {
        const { commentId, content } = input;

        // Sanitize content
        const sanitizedContent = sanitizeContent(content);

        // Update comment in database
        const { data: updatedComment, error } = await supabase
          .from('comments')
          .update({
            content: sanitizedContent,
            is_edited: true,
            edited_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', commentId)
          .select(`
            id,
            post_id,
            author_name,
            author_email,
            author_website,
            content,
            status,
            parent_id,
            likes,
            is_edited,
            edited_at,
            created_at
          `)
          .single();

        if (error || !updatedComment) {
          if (import.meta.env.DEV) {
            console.error('Error updating comment:', error);
          }
          return {
            success: false,
            message: 'Comment not found or update failed',
          };
        }

        // Map to Comment interface
        const mappedComment = await mapDbCommentToComment(updatedComment);

        return {
          success: true,
          comment: mappedComment,
          message: 'Comment updated successfully',
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error updating comment:', error);
        }
        return {
          success: false,
          message: 'Failed to update comment',
        };
      }
    }),
});
