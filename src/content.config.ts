import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    author: z.string().default('Piyush Mehta'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
        type: z.string().optional(),
      })
      .optional(),
    banner: z.string().optional(),
    ogTemplate: z
      .enum(['default', 'minimal', 'tech', 'blog', 'modern', 'professional'])
      .default('default')
      .optional(),
    ogTheme: z.enum(['dark', 'light', 'retro']).default('dark').optional(),
  }),
});

export const collections = {
  blog,
};
