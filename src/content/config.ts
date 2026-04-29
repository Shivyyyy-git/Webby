import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    order: z.number(),
    title: z.string(),
    titleEm: z.string(),
    role: z.string(),
    era: z.string(),
    note: z.string(),
    tags: z.array(z.string()),
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    accent: z.enum(['terra', 'moss', 'ink']).default('terra'),
  }),
});

export const collections = { work };
