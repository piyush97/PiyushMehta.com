// Comment System Client-side Initialization
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CommentSystem } from '../components/CommentSystem';

// Initialize comment system when DOM is ready
function initializeCommentSystem() {
  const commentRoot = document.getElementById('comment-system-root');

  if (!commentRoot) {
    console.warn('Comment system root element not found');
    return;
  }

  const postId = commentRoot.getAttribute('data-post-id');

  if (!postId) {
    console.warn('Post ID not found for comment system');
    return;
  }

  try {
    // Create React root and render comment system
    const root = createRoot(commentRoot);

    root.render(
      React.createElement(CommentSystem, {
        postId: postId,
        allowReplies: true,
        allowLikes: true,
        allowEditing: false,
        moderationEnabled: true,
        maxNestingLevel: 3,
        placeholder: `Share your thoughts about this post...`,
        className: 'comment-system-blog',
        onCommentsLoad: (comments) => {
          console.log(`Loaded ${comments.length} comments for post ${postId}`);

          // Update page meta for SEO
          const commentsCount = comments.length;
          if (commentsCount > 0) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              const currentContent = metaDescription.getAttribute('content') || '';
              if (!currentContent.includes('comments')) {
                metaDescription.setAttribute(
                  'content',
                  `${currentContent} | ${commentsCount} comment${commentsCount !== 1 ? 's' : ''}`
                );
              }
            }
          }
        },
        onCommentSubmit: (comment) => {
          console.log('Comment submitted:', comment);

          // Track comment submission analytics
          if (typeof gtag === 'function') {
            gtag('event', 'comment_submit', {
              post_id: postId,
              comment_length: comment.content.length,
            });
          }

          // Show success notification
          showNotification('Comment posted successfully!', 'success');
        },
      })
    );

    console.log(`Comment system initialized for post: ${postId}`);
  } catch (error) {
    console.error('Failed to initialize comment system:', error);

    // Show fallback message
    commentRoot.innerHTML = `
      <div class="comment-system-error bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p class="text-red-800 mb-2">
          ⚠️ Unable to load the comment system
        </p>
        <p class="text-red-600 text-sm">
          Please try refreshing the page or use the GitHub Discussions below.
        </p>
      </div>
    `;
  }
}

// Simple notification system
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.comment-notification');
  existingNotifications.forEach((el) => el.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `comment-notification fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;

  // Style based on type
  switch (type) {
    case 'success':
      notification.classList.add('bg-green-100', 'border', 'border-green-200', 'text-green-800');
      break;
    case 'error':
      notification.classList.add('bg-red-100', 'border', 'border-red-200', 'text-red-800');
      break;
    case 'info':
    default:
      notification.classList.add('bg-blue-100', 'border', 'border-blue-200', 'text-blue-800');
      break;
  }

  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="flex-1">${message}</span>
      <button class="text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Slide in
  requestAnimationFrame(() => {
    notification.classList.remove('translate-x-full');
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

// Check if we're in the browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCommentSystem);
  } else {
    initializeCommentSystem();
  }

  // Re-initialize on navigation (for SPA-like behavior)
  window.addEventListener('popstate', initializeCommentSystem);

  // Expose notification function globally for component use
  (
    window as Window & { showCommentNotification?: typeof showNotification }
  ).showCommentNotification = showNotification;
}

export { initializeCommentSystem, showNotification };
