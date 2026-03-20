// src/features/blog/lib/service.ts
import { getAllPostModules } from './repository'
import { ok, err } from '../../../lib/result'
import { notFoundError } from '../../../lib/errors'
import type { Result } from '../../../lib/result'
import type { Post } from '../types'

export function listPosts(): Result<Post[]> {
  const posts = getAllPostModules()
    .filter((p) => !p.frontmatter.draft)
    .sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime())
  return ok(posts)
}

export function findPost(slug: string): Result<Post> {
  const post = getAllPostModules().find((p) => p.slug === slug && !p.frontmatter.draft)
  if (!post) return err(notFoundError(`blog/${slug}`))
  return ok(post)
}
