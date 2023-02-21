import {
  Action,
  ActionCategory,
  ActionType,
  DB,
  dbSchema,
} from '../helpers/DBHelpers';
import { z } from 'zod';

// https://github.com/uuidjs/uuid/pull/654
import { v4 as uuidv4 } from 'uuid';

import {
  getGoogleDriveFileContent,
  updateGoogleDriveFile,
} from '../helpers/GoogleApi';

export type NewAction = Omit<Action, 'date' | 'id'>;

type DBApiRequiredAttrs = {
  gdFileId: string;
};

export const TokenInfoSchema = z.object({
  rt: z.string(),
  at: z.string(),
  cs: z.string(),
});

export type TokenInfo = z.infer<typeof TokenInfoSchema>;

export async function getDB(tokenInfo: TokenInfo, attrs: DBApiRequiredAttrs) {
  const fileContent = await getGoogleDriveFileContent(tokenInfo, attrs);

  return {
    accessToken: fileContent.accessToken,
    db: dbSchema.parse(fileContent.data.data),
  };
}

export async function updateDB(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { db: DB }
) {
  const newDB: DB = dbSchema.parse({
    ...attrs.db,
    updatedAt: new Date().toISOString(),
  });

  const resp = await updateGoogleDriveFile(tokenInfo, {
    gdFileId: attrs.gdFileId,
    blob: new Blob([JSON.stringify(newDB, undefined, 2)]),
  });

  return { accessToken: resp.accessToken, db: newDB };
}

export async function addAction(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { newAction: NewAction }
) {
  const { db } = await getDB(tokenInfo, attrs);

  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      actions: [...db.actions, { ...attrs.newAction, id, date }],
    },
  });
}

export async function deleteAction(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { actionId: string }
) {
  const { db } = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();
  const newActions = db.actions.filter(
    (action) => action.id !== attrs.actionId
  );

  return updateDB(tokenInfo, {
    ...attrs,
    db: { ...db, updatedAt: date, actions: newActions },
  });
}

export async function editAction(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { action: Action }
) {
  const { db } = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      actions: db.actions.map((el) =>
        el.id !== attrs.action.id ? el : { ...el, ...attrs.action }
      ),
    },
  });
}

export async function addCategory(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { category: ActionCategory; type: ActionType }
) {
  const { db } = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      incomeCategories: [
        ...(attrs.type === 'income' ? [{ ...attrs.category, id }] : []),
        ...db.incomeCategories,
      ],
      expenseCategories: [
        ...(attrs.type === 'expense' ? [{ ...attrs.category, id }] : []),
        ...db.expenseCategories,
      ],
    },
  });
}

export async function editCategory(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { category: ActionCategory }
) {
  const { db } = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      incomeCategories: db.incomeCategories.map((it) =>
        it.id === attrs.category.id ? { ...attrs.category } : it
      ),
      expenseCategories: db.expenseCategories.map((it) =>
        it.id === attrs.category.id ? { ...attrs.category } : it
      ),
    },
  });
}

export async function deleteCategory(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { categoryId: string }
) {
  const { db } = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      incomeCategories: db.incomeCategories.filter(
        (it) => it.id !== attrs.categoryId
      ),
      expenseCategories: db.expenseCategories.filter(
        (it) => it.id !== attrs.categoryId
      ),
    },
  });
}
