import Ajv, { JSONSchemaType } from 'ajv';

export type ActionType = 'expense' | 'income';

export type ActionCategory = {
  id: string;
  name: string;
  description?: string;
};

export type Action = {
  id: string;
  date: string;
  type: ActionType;
  value: number;
  expenseCategory?: string;
  incomeCategory?: string;
  description?: string;
};

export interface DB {
  updatedAt: string;
  expenseCategories: ActionCategory[];
  incomeCategories: ActionCategory[];
  nextPage?: string;
  actions: Action[];
}

const schema: JSONSchemaType<DB> = {
  type: 'object',
  required: [],
  additionalProperties: false,
  definitions: {
    actionCategory: {
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
      },
    },
  },
  properties: {
    updatedAt: { type: 'string' },
    nextPage: { type: 'string', nullable: true },

    expenseCategories: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/actionCategory',
        required: [],
      },
    },
    incomeCategories: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/actionCategory',
        required: [],
      },
    },

    actions: {
      type: 'array',
      items: {
        type: 'object',
        required: [],
        properties: {
          id: { type: 'string' },
          date: { type: 'string' },
          value: { type: 'number' },
          type: { type: 'string', enum: ['expense', 'income'] },
          expenseCategory: { type: 'string', nullable: true },
          incomeCategory: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
        },
      },
    },
  },
};

export const initialDB: DB = {
  updatedAt: new Date().toISOString(),
  actions: [],
  expenseCategories: [],
  incomeCategories: [],
};

export function validateDB(data: any): data is DB {
  const ajv = new Ajv();
  const validate = ajv.compile<DB>(schema);
  return validate(data);
}
