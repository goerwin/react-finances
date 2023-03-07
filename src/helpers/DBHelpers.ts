import { z } from 'zod';

const typeSchema = z.enum(['expense', 'income']);

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  type: typeSchema,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

const walletSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  type: typeSchema,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

const tagSchema = z.object({
  id: z.string(),
  sortPriority: z.number(),
  name: z.string(),
  type: typeSchema,
  categoryIds: z.array(categorySchema.shape.id),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

const actionSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  value: z.number(),
  type: typeSchema,
  description: z.string().optional(),
  walletId: walletSchema.shape.id,
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
export type ActionType = z.infer<typeof typeSchema>;
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
