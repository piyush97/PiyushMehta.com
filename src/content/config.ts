import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
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
      .enum([
        'default',
        'minimal',
        'tech',
        'blog',
        'cyber',
        'gradient',
        'terminal',
        'modern',
        'professional',
      ])
      .default('modern')
      .optional(),
    ogTheme: z
      .enum(['dark', 'light', 'retro', 'neon', 'corporate', 'warm', 'ocean'])
      .default('dark')
      .optional(),
  }),
});

export const collections = {
  blog,
};
