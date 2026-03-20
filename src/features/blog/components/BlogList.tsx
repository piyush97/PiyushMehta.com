// src/features/blog/components/BlogList.tsx
import type { Post } from '../types'
import { BlogCard } from './BlogCard'

interface Props { posts: Post[] }
export function BlogList({ posts }: Props) {
  if (posts.length === 0) return <p className="blog-empty">No posts yet.</p>
  return (
    <div className="blog-grid">
      {posts.map((post) => <BlogCard key={post.slug} post={post} />)}
    </div>
  )
}
