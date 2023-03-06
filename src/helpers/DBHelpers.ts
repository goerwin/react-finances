import { z } from 'zod';

const actionTypeSchema = z.enum(['expense', 'income']);

const actionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  // TODO:
  // type: actionTypeSchema,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

const walletSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortPriority: z.number(),
  type: actionTypeSchema,
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

const tagSchema = z.object({
  id: z.string(),
  sortPriority: z.number(),
  name: z.string(),
  // TODO:
  // type: actionTypeSchema,
  categories: z.array(actionCategorySchema.shape.id),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

const actionSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  value: z.number(),
  type: actionTypeSchema,
  description: z.string().optional(),
  walletId: walletSchema.shape.id,
  // TODO: Should be categoryId and should be mandatory
  expenseCategory: actionCategorySchema.shape.id.optional(),
  incomeCategory: actionCategorySchema.shape.id.optional(),
});

export const dbSchema = z.object({
  updatedAt: z.string().datetime(),
  nextPage: z.string().optional(),
  // TODO: should be one array of tags
  expenseTags: z.array(tagSchema),
  incomeTags: z.array(tagSchema),
  wallets: z.array(walletSchema),
  // TODO: should be one array of categories
  expenseCategories: z.array(actionCategorySchema),
  incomeCategories: z.array(actionCategorySchema),
  actions: z.array(actionSchema),
});

export type DB = z.infer<typeof dbSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type Action = z.infer<typeof actionSchema>;
export type ActionCategory = z.infer<typeof actionCategorySchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Tag = z.infer<typeof tagSchema>;

export const initialDB: DB = {
  updatedAt: new Date().toISOString(),
  wallets: [],
  expenseTags: [],
  incomeTags: [],
  actions: [],
  expenseCategories: [],
  incomeCategories: [],
};
