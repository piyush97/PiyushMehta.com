// src/features/blog/lib/repository.ts
// @mdx-js/rollup compiles ALL MDX files at build time.
// remark-mdx-frontmatter exports frontmatter as a named 'frontmatter' export.
// The glob matches both subdirectory posts (*/index.mdx) and any loose top-level .mdx files.
import type { ComponentType } from 'react'
import { validateFrontmatter } from './schemas'
import type { Post } from '../types'

const modules = import.meta.glob<{
  default: ComponentType
  frontmatter: Record<string, unknown>
}>(
  [
    '../../../content/blog/*/index.mdx',
    '../../../content/blog/*.mdx',
  ],
  { eager: true }
)

function extractSlug(path: string): string {
  // ../../../content/blog/my-post/index.mdx → my-post
  // ../../../content/blog/my-post.mdx → my-post
  const withDir = path.match(/\/blog\/([^/]+)\/index\.mdx$/)
  if (withDir) return withDir[1]
  const loose = path.match(/\/blog\/([^/]+)\.mdx$/)
  return loose?.[1] ?? path
}

export function getAllPostModules(): Post[] {
  return Object.entries(modules).map(([path, mod]) => {
    const slug = extractSlug(path)
    const frontmatter = validateFrontmatter(mod.frontmatter, slug)
    return { slug, frontmatter, Component: mod.default }
  })
}
