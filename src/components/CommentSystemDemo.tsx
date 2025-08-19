import React from 'react';
import type { Comment, CommentFormData } from '../types/comment';
import { CommentSystem } from './CommentSystem';
import { withErrorBoundary } from './ErrorBoundary';

/**
 * Demo component showcasing the CommentSystem
 * This can be used in blog posts or articles to demonstrate the comment functionality
 */
const CommentSystemDemo: React.FC = () => {
  const handleCommentsLoad = (comments: Comment[]) => {
    console.log('Comments loaded:', comments.length);
  };

  const handleCommentSubmit = (comment: CommentFormData) => {
    console.log('Comment submitted:', comment);
  };

  return (
    <div className="comment-demo max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4">💬 Interactive Comment System</h2>
        <p className="text-text-secondary mb-6">
          Experience our fully-featured comment system with real-time interactions, nested replies,
          and modern design. Try leaving a comment below!
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">✨ Features Included:</h3>
          <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
            <li>Real-time comment submission and updates</li>
            <li>Nested replies with configurable depth</li>
            <li>Like/unlike functionality with optimistic updates</li>
            <li>Responsive design for all screen sizes</li>
            <li>Accessibility compliant (WCAG 2.1 AA)</li>
            <li>Dark/light theme support</li>
            <li>Spam protection and content validation</li>
            <li>User avatar generation</li>
            <li>Comment moderation system</li>
            <li>Error boundary integration</li>
          </ul>
        </div>
      </div>

      {/* Demo Comment System */}
      <CommentSystem
        postId="demo-post-123"
        allowReplies={true}
        allowLikes={true}
        allowEditing={false}
        moderationEnabled={false}
        maxNestingLevel={3}
        placeholder="Share your thoughts about this demo..."
        onCommentsLoad={handleCommentsLoad}
        onCommentSubmit={handleCommentSubmit}
        className="demo-comments"
      />

      {/* Integration Guide */}
      <div className="mt-12 bg-gradient-card border border-card-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">🚀 How to Integrate</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-text-primary mb-2">1. Basic Usage</h4>
            <pre className="bg-light-800 border border-card-border rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-text-primary">{`import { CommentSystem } from './components/CommentSystem';

<CommentSystem 
  postId="your-post-id"
  allowReplies={true}
  allowLikes={true}
  placeholder="Leave a comment..."
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-2">2. Advanced Configuration</h4>
            <pre className="bg-light-800 border border-card-border rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-text-primary">{`<CommentSystem 
  postId="blog-post-123"
  maxNestingLevel={3}
  allowReplies={true}
  allowLikes={true}
  allowEditing={false}
  moderationEnabled={true}
  placeholder="What are your thoughts?"
  onCommentsLoad={(comments) => console.log(comments)}
  onCommentSubmit={(comment) => saveToAnalytics(comment)}
  className="my-custom-comments"
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-2">3. Styling</h4>
            <p className="text-text-secondary text-sm mb-2">
              Import the comment styles in your main CSS file:
            </p>
            <pre className="bg-light-800 border border-card-border rounded-lg p-4 text-sm">
              <code className="text-text-primary">{`@import '../styles/comments.css';`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-2">4. API Integration</h4>
            <p className="text-text-secondary text-sm mb-2">
              Configure your API endpoints in the comment service:
            </p>
            <pre className="bg-light-800 border border-card-border rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-text-primary">{`// Update API_BASE_URL in commentApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Implement your backend endpoints:
// GET /api/comments - List comments
// POST /api/comments - Create comment  
// PUT /api/comments/:id - Update comment
// DELETE /api/comments/:id - Delete comment
// POST /api/comments/like - Like/unlike comment`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="mt-8 bg-gradient-card border border-card-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">⚙️ Technical Specifications</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-text-primary mb-3">Frontend</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• React 19+ with TypeScript</li>
              <li>• Responsive Tailwind CSS</li>
              <li>• Error boundary integration</li>
              <li>• Accessibility (WCAG 2.1 AA)</li>
              <li>• Dark/light theme support</li>
              <li>• Mobile-optimized interface</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-3">Backend Requirements</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• RESTful API endpoints</li>
              <li>• Comment CRUD operations</li>
              <li>• User authentication (optional)</li>
              <li>• Spam detection/moderation</li>
              <li>• Rate limiting</li>
              <li>• Real-time updates (optional)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export wrapped component with error boundary
export const WrappedCommentSystemDemo = withErrorBoundary(CommentSystemDemo);
export { WrappedCommentSystemDemo as CommentSystemDemo };
