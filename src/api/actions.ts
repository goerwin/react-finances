import { GAPI_DB_PATH } from '../config';
import {
  Action,
  ActionCategory,
  ActionType,
  DB,
  validateDB
} from '../helpers/DBValidator';

// https://github.com/uuidjs/uuid/pull/654
import { v4 as uuidv4 } from 'uuid';

import {
  getGoogleDriveElementInfo,
  getGoogleDriveFileContent, updateGoogleDriveFile
} from '../helpers/GoogleApi';

export type NewAction = Omit<Action, 'date' | 'id'>;

export async function getDB(attrs: {
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const fileContent = await getGoogleDriveFileContent({
    gapi: attrs.gapi,
    path: GAPI_DB_PATH,
    accessToken: attrs.accessToken,
  });

  const db = await fileContent?.json();

  if (!validateDB(db)) throw new Error('DB Bad Format');

  db.expenseCategories.reverse();
  db.incomeCategories.reverse();

  return db;
}

export async function updateDB(attrs: {
  gapi: typeof gapi;
  google: typeof google;
  db: DB;
  accessToken: string;
}) {
  const dbElInfo = await getGoogleDriveElementInfo({
    path: GAPI_DB_PATH,
    gapi: attrs.gapi,
    accessToken: attrs.accessToken,
  });

  const dbFileId = dbElInfo?.id;

  if (!dbFileId) throw new Error(`DB Does not exist in ${GAPI_DB_PATH}`);

  const newDB: DB = {
    ...attrs.db,
    updatedAt: new Date().toISOString(),
  };

  const resp = await updateGoogleDriveFile({
    accessToken: attrs.accessToken,
    blob: new Blob([JSON.stringify(newDB, undefined, 2)]),
    fileId: dbFileId,
  });

  return resp.json();
}

export async function addAction(attrs: {
  newAction: NewAction;
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const db = await getDB({
    gapi: attrs.gapi,
    google: attrs.google,
    accessToken: attrs.accessToken,
  });

  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB({
    gapi,
    google,
    accessToken: attrs.accessToken,
    db: {
      ...db,
      updatedAt: date,
      actions: [...db.actions, { ...attrs.newAction, id, date }],
    },
  });
}

export async function deleteAction(attrs: {
  actionId: string;
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const db = await getDB({
    gapi: attrs.gapi,
    google: attrs.google,
    accessToken: attrs.accessToken,
  });
  const date = new Date().toISOString();
  const newActions = db.actions.filter((el) => el.id !== attrs.actionId);

  return updateDB({
    gapi,
    google,
    accessToken: attrs.accessToken,
    db: { ...db, updatedAt: date, actions: newActions },
  });
}

export async function editAction(attrs: {
  action: Action;
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const db = await getDB({
    gapi: attrs.gapi,
    google: attrs.google,
    accessToken: attrs.accessToken,
  });
  const date = new Date().toISOString();
  const newActions = db.actions.map((el) =>
    el.id !== attrs.action.id
      ? el
      : {
          ...el,
          ...attrs.action,
        }
  );

  return updateDB({
    gapi,
    google,
    accessToken: attrs.accessToken,
    db: { ...db, updatedAt: date, actions: newActions },
  });
}

export async function addCategory(attrs: {
  category: ActionCategory;
  type: ActionType;
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const db = await getDB({
    gapi: attrs.gapi,
    google: attrs.google,
    accessToken: attrs.accessToken,
  });

  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB({
    gapi,
    google,
    accessToken: attrs.accessToken,
    db: {
      ...db,
      updatedAt: date,
      incomeCategories: [
        ...db.incomeCategories,
        ...(attrs.type === 'income' ? [{ ...attrs.category, id }] : []),
      ],
      expenseCategories: [
        ...db.expenseCategories,
        ...(attrs.type === 'expense' ? [{ ...attrs.category, id }] : []),
      ],
    },
  });
}

export async function editCategory(attrs: {
  category: ActionCategory;
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const db = await getDB({
    gapi: attrs.gapi,
    google: attrs.google,
    accessToken: attrs.accessToken,
  });
  const date = new Date().toISOString();

  const newIncomeCategories = db.incomeCategories.map((it) =>
    it.id === attrs.category.id ? { ...attrs.category } : it
  );

  const newExpenseCategories = db.expenseCategories.map((it) =>
    it.id === attrs.category.id ? { ...attrs.category } : it
  );

  return updateDB({
    gapi,
    google,
    accessToken: attrs.accessToken,
    db: {
      ...db,
      updatedAt: date,
      incomeCategories: newIncomeCategories,
      expenseCategories: newExpenseCategories,
    },
  });
}

export async function deleteCategory(attrs: {
  categoryId: string;
  gapi: typeof gapi;
  google: typeof google;
  accessToken: string;
}) {
  const db = await getDB({
    gapi: attrs.gapi,
    google: attrs.google,
    accessToken: attrs.accessToken,
  });
  const date = new Date().toISOString();

  const newIncomeCategories = db.incomeCategories.filter(
    (it) => it.id !== attrs.categoryId
  );

  const newExpenseCategories = db.expenseCategories.filter(
    (it) => it.id !== attrs.categoryId
  );

  return updateDB({
    gapi,
    google,
    accessToken: attrs.accessToken,
    db: {
      ...db,
      updatedAt: date,
      incomeCategories: newIncomeCategories,
      expenseCategories: newExpenseCategories,
    },
  });
}
