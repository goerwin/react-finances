import {
  Action,
  ActionCategory,
  ActionType,
  DB,
  dbSchema,
} from '../helpers/DBHelpers';

// https://github.com/uuidjs/uuid/pull/654
import { v4 as uuidv4 } from 'uuid';

import {
  getGoogleDriveFileContent,
  updateGoogleDriveFile,
} from '../helpers/GoogleApi';

export type NewAction = Omit<Action, 'date' | 'id'>;

type DBApiRequiredAttrs = {
  accessToken: string;
  gdFileId: string;
};

export async function getDB(attrs: DBApiRequiredAttrs) {
  const fileContent = await getGoogleDriveFileContent(attrs);
  const db = await fileContent.json();
  return dbSchema.parse(db);
}

export async function updateDB(attrs: DBApiRequiredAttrs & { db: DB }) {
  const newDB: DB = dbSchema.parse({
    ...attrs.db,
    updatedAt: new Date().toISOString(),
  });

  const resp = await updateGoogleDriveFile({
    accessToken: attrs.accessToken,
    gdFileId: attrs.gdFileId,
    blob: new Blob([JSON.stringify(newDB, undefined, 2)]),
  });

  if (!resp.ok) throw new Error(resp.statusText);

  return newDB;
}

export async function addAction(
  attrs: DBApiRequiredAttrs & { newAction: NewAction }
) {
  const db = await getDB(attrs);

  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB({
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      actions: [...db.actions, { ...attrs.newAction, id, date }],
    },
  });
}

export async function deleteAction(
  attrs: DBApiRequiredAttrs & { actionId: string }
) {
  const db = await getDB(attrs);
  const date = new Date().toISOString();
  const newActions = db.actions.filter(
    (action) => action.id !== attrs.actionId
  );

  return updateDB({
    ...attrs,
    db: { ...db, updatedAt: date, actions: newActions },
  });
}

export async function editAction(
  attrs: DBApiRequiredAttrs & { action: Action }
) {
  const db = await getDB(attrs);
  const date = new Date().toISOString();

  return updateDB({
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
  attrs: DBApiRequiredAttrs & { category: ActionCategory; type: ActionType }
) {
  const db = await getDB(attrs);
  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB({
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
  attrs: DBApiRequiredAttrs & { category: ActionCategory }
) {
  const db = await getDB(attrs);
  const date = new Date().toISOString();

  return updateDB({
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
  attrs: DBApiRequiredAttrs & { categoryId: string }
) {
  const db = await getDB(attrs);
  const date = new Date().toISOString();

  return updateDB({
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
