// src/routes/blog/$slug.tsx
import { createFileRoute, notFound } from '@tanstack/react-router'
import { findPost } from '../../features/blog/lib'
import { PostHeader } from '../../features/blog/components/PostHeader'
import { PostBody } from '../../features/blog/components/PostBody'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const result = findPost(params.slug)
    if (!result.ok) throw notFound()
    return result.data
  },
  head: ({ loaderData: post }) => ({
    meta: post ? [
      { title: `${post.frontmatter.title} — Piyush Mehta` },
      { name: 'description', content: post.frontmatter.description },
      { property: 'og:title', content: post.frontmatter.title },
      { property: 'og:description', content: post.frontmatter.description },
    ] : [],
  }),
  notFoundComponent: () => (
    <div className="container-base">
      <h1>Post not found</h1>
      <a href="/blog">← Back to blog</a>
    </div>
  ),
  component: BlogPostPage,
})

function BlogPostPage() {
  const post = Route.useLoaderData()
  return (
    <article className="container-base post-container">
      <a href="/blog" className="post-back-link">← Blog</a>
      <PostHeader frontmatter={post.frontmatter} />
      <PostBody Component={post.Component} />
    </article>
  )
}
