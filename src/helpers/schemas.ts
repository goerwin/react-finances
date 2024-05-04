import { z } from 'zod';

const itemTypeSchema = z.enum(['expense', 'income']);

const dbListItemSchema = z.enum(['categories', 'tags', 'actions']);

export type DBListItem = 'categories' | 'tags' | 'actions';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  type: itemTypeSchema,
  description: z.string().optional(),
  expectedPerMonth: z.number().optional(),
});

export const tagSchema = z.object({
  id: z.string(),
  sortPriority: z.number(),
  name: z.string(),
  type: itemTypeSchema,
  description: z.string().optional(),
  expectedPerMonth: z.number().optional(),
  categoryIds: z.array(categorySchema.shape.id),
});

export const actionSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  value: z.number(),
  type: itemTypeSchema,
  trackOnly: z.boolean().optional(),
  withCreditCard: z.boolean().optional(),
  description: z.string().optional(),
  categoryId: categorySchema.shape.id,
});

export const dbSchema = z.object({
  updatedAt: z.string().datetime(),
  nextPage: z.string().optional(),
  tags: z.array(tagSchema),
  categories: z.array(categorySchema),
  actions: z.array(actionSchema),
});

export const queueItemSchema = z.object({
  type: dbListItemSchema,
  status: z.enum(['ready', 'processing', 'error']),
  apiAction: z.enum(['add']),
  title: z.string(),
  description: z.string(),
  data: actionSchema.or(categorySchema).or(tagSchema),
});

export const queueSchema = z.array(queueItemSchema);

export type DB = z.infer<typeof dbSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
export type Queue = z.infer<typeof queueSchema>;

export const initialDB: DB = {
  updatedAt: new Date().toISOString(),
  tags: [],
  categories: [],
  actions: [],
};
