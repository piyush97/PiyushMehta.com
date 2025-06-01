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
      })
      .optional(),
    banner: z.string().optional(),
  }),
});

export const collections = {
  blog,
};
