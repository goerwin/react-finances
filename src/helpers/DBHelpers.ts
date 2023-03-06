import { z } from 'zod';

const actionCategorySchema = z.object({
  id: z.string(),
  sortPriority: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

const actionTypeSchema = z.enum(['expense', 'income']);

const actionSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  value: z.number(),
  type: actionTypeSchema,
  expenseCategory: z.string().optional(),
  incomeCategory: z.string().optional(),
  description: z.string().optional(),
});

const tagSchema = z.object({
  id: z.string(),
  sortPriority: z.number(),
  name: z.string(),
  categories: z.array(actionCategorySchema.shape.id),
  startDate: z.string().datetime().optional(),
  expectedPerMonth: z.number().optional(),
});

export const dbSchema = z.object({
  updatedAt: z.string().datetime(),
  nextPage: z.string().optional(),
  expenseTags: z.array(tagSchema),
  incomeTags: z.array(tagSchema),
  expenseCategories: z.array(actionCategorySchema),
  incomeCategories: z.array(actionCategorySchema),
  actions: z.array(actionSchema),
});

export type DB = z.infer<typeof dbSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type Action = z.infer<typeof actionSchema>;
export type ActionCategory = z.infer<typeof actionCategorySchema>;
export type Tag = z.infer<typeof tagSchema>;

export const initialDB: DB = {
  updatedAt: new Date().toISOString(),
  expenseTags: [],
  incomeTags: [],
  actions: [],
  expenseCategories: [],
  incomeCategories: [],
};
