import {
  Action,
  Category,
  ActionType,
  DB,
  dbSchema,
  Tag,
  Wallet,
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
  cid: z.string(),
  rt: z.string(),
  cs: z.string(),
});

export type TokenInfo = z.infer<typeof TokenInfoSchema>;

export async function getDB(tokenInfo: TokenInfo, attrs: DBApiRequiredAttrs) {
  const fileContent = await getGoogleDriveFileContent(tokenInfo, attrs);

  return dbSchema.parse(fileContent.data);
}

export async function updateDB(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { db: DB }
) {
  const newDB: DB = dbSchema.parse({
    ...attrs.db,
    updatedAt: new Date().toISOString(),
  });

  void (await updateGoogleDriveFile(tokenInfo, {
    gdFileId: attrs.gdFileId,
    blob: new Blob([JSON.stringify(newDB, undefined, 2)]),
  }));

  return newDB;
}

export async function addAction(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { newAction: NewAction }
) {
  const db = await getDB(tokenInfo, attrs);

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
  const db = await getDB(tokenInfo, attrs);
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
  const db = await getDB(tokenInfo, attrs);
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
  attrs: DBApiRequiredAttrs & { data: Category; type: ActionType }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      categories: [{ ...attrs.data, id }, ...db.categories],
    },
  });
}

export async function editCategory(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { data: Category }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      categories: db.categories.map((it) =>
        it.id === attrs.data.id ? { ...attrs.data } : it
      ),
    },
  });
}

export async function deleteCategory(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { id: string }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      categories: db.categories.filter((it) => it.id !== attrs.id),
    },
  });
}

export async function addTag(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { data: Tag; type: ActionType }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      tags: [{ ...attrs.data, id }, ...db.tags],
    },
  });
}

export async function editTag(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { data: Tag }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      tags: db.tags.map((it) =>
        it.id === attrs.data.id ? { ...attrs.data } : it
      ),
    },
  });
}

export async function deleteTag(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { id: string }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      tags: db.tags.filter((it) => it.id !== attrs.id),
    },
  });
}

export async function addWallet(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { data: Wallet; type: ActionType }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      wallets: [{ ...attrs.data, id }, ...db.wallets],
    },
  });
}

export async function editWallet(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { data: Wallet }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      wallets: db.wallets.map((it) =>
        it.id === attrs.data.id ? { ...attrs.data } : it
      ),
    },
  });
}

export async function deleteWallet(
  tokenInfo: TokenInfo,
  attrs: DBApiRequiredAttrs & { id: string }
) {
  const db = await getDB(tokenInfo, attrs);
  const date = new Date().toISOString();

  return updateDB(tokenInfo, {
    ...attrs,
    db: {
      ...db,
      updatedAt: date,
      wallets: db.wallets.filter((it) => it.id !== attrs.id),
    },
  });
}
