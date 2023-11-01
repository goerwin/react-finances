import { z } from 'zod';

const itemTypeSchema = z.enum(['expense', 'income']);

export const walletSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  type: itemTypeSchema,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  type: itemTypeSchema,
  walletId: walletSchema.shape.id,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

export const tagSchema = z.object({
  id: z.string(),
  sortPriority: z.number(),
  name: z.string(),
  type: itemTypeSchema,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
  categoryIds: z.array(categorySchema.shape.id),
  walletIds: z.array(walletSchema.shape.id),
});

export const actionSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  value: z.number(),
  type: itemTypeSchema,
  trackOnly: z.boolean().optional(),
  description: z.string().optional(),
  categoryId: categorySchema.shape.id,
});

export const dbSchema = z.object({
  updatedAt: z.string().datetime(),
  nextPage: z.string().optional(),
  tags: z.array(tagSchema),
  wallets: z.array(walletSchema),
  categories: z.array(categorySchema),
  actions: z.array(actionSchema),
});

export type DB = z.infer<typeof dbSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Tag = z.infer<typeof tagSchema>;

export const initialDB: DB = {
  updatedAt: new Date().toISOString(),
  wallets: [],
  tags: [],
  categories: [],
  actions: [],
};
