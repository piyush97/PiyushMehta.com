// src/features/blog/components/BlogCard.tsx
import type { Post } from '../types'
import { TagList } from './TagList'

interface Props { post: Post }

export function BlogCard({ post }: Props) {
  const { slug, frontmatter } = post
  const formattedDate = frontmatter.date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <article className="blog-card">
      <a href={`/blog/${slug}`} className="blog-card-link">
        <div className="blog-card-content">
          <time dateTime={frontmatter.date.toISOString()} className="blog-card-date">
            {formattedDate}
          </time>
          <h2 className="blog-card-title">{frontmatter.title}</h2>
          <p className="blog-card-description">{frontmatter.description}</p>
          <TagList tags={frontmatter.tags} />
        </div>
      </a>
    </article>
  )
}
