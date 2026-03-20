// src/features/blog/lib/schemas.ts
import { z } from 'zod'

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  image: z.object({ url: z.string(), alt: z.string() }).optional(),
})

export function validateFrontmatter(raw: unknown, slug: string) {
  const result = PostFrontmatterSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Invalid frontmatter in blog/${slug}: ${result.error.message}`)
  }
  return result.data
}
