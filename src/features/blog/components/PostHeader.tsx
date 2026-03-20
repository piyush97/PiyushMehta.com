// src/features/blog/components/PostHeader.tsx
import type { PostFrontmatter } from '../types'
import { TagList } from './TagList'

interface Props { frontmatter: PostFrontmatter }
export function PostHeader({ frontmatter }: Props) {
  return (
    <header className="post-header">
      <time dateTime={frontmatter.date.toISOString()} className="post-date">
        {frontmatter.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      <h1 className="post-title">{frontmatter.title}</h1>
      <p className="post-description">{frontmatter.description}</p>
      <TagList tags={frontmatter.tags} />
    </header>
  )
}
