// src/routes/blog/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { listPosts } from '../../features/blog/lib'
import { BlogList } from '../../features/blog/components/BlogList'

export const Route = createFileRoute('/blog/')({
  loader: () => {
    const result = listPosts()
    if (!result.ok) throw new Error('Failed to load posts')
    return result.data
  },
  head: () => ({
    meta: [
      { title: 'Blog — Piyush Mehta' },
      { name: 'description', content: 'Technical articles on software engineering, distributed systems, and web development.' },
    ],
  }),
  component: BlogPage,
})

function BlogPage() {
  const posts = Route.useLoaderData()
  return (
    <div className="container-base">
      <header className="blog-header">
        <h1 className="blog-title">Blog</h1>
        <p className="blog-subtitle">Technical writing on software engineering.</p>
      </header>
      <BlogList posts={posts} />
    </div>
  )
}
