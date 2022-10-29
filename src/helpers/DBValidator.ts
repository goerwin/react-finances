import Ajv, { JSONSchemaType } from 'ajv';

export type ActionType = 'expense' | 'income';

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
  expenseCategories: { id: string; name: string }[];
  incomeCategories: { id: string; name: string }[];
  nextPage?: string;
  actions: Action[];
}

const schema: JSONSchemaType<DB> = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    updatedAt: { type: 'string' },
    nextPage: { type: 'string', nullable: true },
    expenseCategories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
    },
    incomeCategories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
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
  updatedAt: '2022-10-10T00:00:00.000Z',
  actions: [],
  expenseCategories: [
    { id: '3fc2fc57-e69f-4250-ae65-b4222387acb4', name: 'Comida' },
    { id: '19dba5fc-d071-41f7-8d24-835b7bac0250', name: 'Servicio Público' },
    { id: '3fc2fc57-e69f-4250-ae65-b4222387acb5', name: 'Otros' },
  ],
  incomeCategories: [
    { id: '49f43966-3b12-4933-ba89-08dba0f7f23c', name: 'Salario' },
    { id: '0f76a9e9-4104-443b-89d7-a955503a4836', name: 'Préstamo' },
    { id: '3fc2fc57-e69f-4250-ae65-b4222387acb6', name: 'Otros' },
  ],
};

export function validateDB(data: any): data is DB {
  const ajv = new Ajv();
  const validate = ajv.compile<DB>(schema);
  return validate(data);
}
