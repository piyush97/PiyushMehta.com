// src/features/blog/types.ts
import type { ComponentType } from 'react'

export interface PostFrontmatter {
  title: string
  description: string
  date: Date
  tags: string[]
  draft: boolean
  image?: { url: string; alt: string }
}

export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  Component: ComponentType
}
