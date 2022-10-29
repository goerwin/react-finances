import { Action, DB, validateDB } from '../helpers/DBValidator';
import { GAPI_CLIENT_ID, GAPI_DB_PATH, GAPI_SCOPE } from '../config';

// https://github.com/uuidjs/uuid/pull/654
import { v4 as uuidv4 } from 'uuid';

let dummyDb: DB = {
  updatedAt: '2022-10-28T23:32:42.778Z',
  actions: [
    // {
    //   expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac0250',
    //   type: 'expense',
    //   value: 80000,
    //   id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbdb972',
    //   date: '2022-10-28T23:27:28.878Z',
    // },
    // {
    //   expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac0250',
    //   type: 'expense',
    //   value: 80000,
    //   id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbdb972',
    //   date: '2022-10-28T23:27:28.878Z',
    // },
    // {
    //   expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac0250',
    //   type: 'expense',
    //   value: 80000,
    //   id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbdb972',
    //   date: '2022-10-28T23:27:28.878Z',
    // },
    // {
    //   expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac0250',
    //   type: 'expense',
    //   value: 80000,
    //   id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbdb972',
    //   date: '2022-10-28T23:27:28.878Z',
    // },
    // {
    //   expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac0250',
    //   type: 'expense',
    //   value: 80000,
    //   id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbdb972',
    //   date: '2022-10-28T23:27:28.878Z',
    // },
    {
      expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac02bb',
      type: 'expense',
      value: 3000000,
      id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbab972',
      date: '2022-10-01T05:00:00.000Z',
    },
    {
      expenseCategory: '19dba5fc-d071-41f7-8d24-835b7bac0250',
      type: 'expense',
      value: 80000,
      id: 'e7cd88eb-e4fc-4a2c-8ae8-bdde1dbdb972',
      date: '2022-10-28T12:27:28.878Z',
    },
    {
      incomeCategory: '49f43966-3b12-4933-ba89-08dba0f7f23c',
      type: 'income',
      value: 9500000,
      id: 'ec609aeb-b427-4c8a-9c01-c66deca8b841',
      date: '2022-10-28T23:27:48.320Z',
    },
    {
      incomeCategory: '49f43966-3b12-4933-ba89-08dba0f7f23c',
      type: 'income',
      value: 50000,
      id: '6589efcc-852e-4ab1-a3d6-c31687c5d569',
      date: '2022-10-28T23:08:31.809Z',
    },
    {
      incomeCategory: '0f76a9e9-4104-443b-89d7-a955503a4836',
      type: 'income',
      value: 80000,
      id: 'bf880fa8-4f5e-4891-b24f-6ab0e43d9844',
      date: '2022-10-28T23:32:40.507Z',
    },
  ],
  expenseCategories: [
    {
      id: '3fc2fc57-e69f-4250-ae65-b4222387acb4',
      name: 'Comida',
    },
    {
      id: '19dba5fc-d071-41f7-8d24-835b7bac0250',
      name: 'Servicio Público',
    },
  ],
  incomeCategories: [
    {
      id: '49f43966-3b12-4933-ba89-08dba0f7f23c',
      name: 'Salario',
    },
    {
      id: '0f76a9e9-4104-443b-89d7-a955503a4836',
      name: 'Préstamo',
    },
  ],
};

import {
  getGoogleDriveElementInfo,
  getGoogleDriveFileContent,
  requestGapiAccessToken,
  updateGoogleDriveFile,
} from '../helpers/GoogleApi';

export type NewAction = Omit<Action, 'date' | 'id'>;

export async function getDB(attrs: {
  gapi: typeof gapi;
  google: typeof google;
}): Promise<DB> /* TODO: Remove return type*/ {
  return dummyDb;

  const accessToken = await requestGapiAccessToken({
    gapi: attrs.gapi,
    google: attrs.google,
    clientId: GAPI_CLIENT_ID,
    scope: GAPI_SCOPE,
    skipConsentOnNoToken: true,
  });

  const fileContent = await getGoogleDriveFileContent({
    gapi: attrs.gapi,
    path: GAPI_DB_PATH,
    accessToken: accessToken.access_token,
  });

  const db = await fileContent?.json();

  if (!validateDB(db)) throw new Error('DB Bad Format');
  return db;
}

export async function updateDB(attrs: {
  gapi: typeof gapi;
  google: typeof google;
  db: DB;
}) {
  const newDB: DB = {
    ...attrs.db,
    updatedAt: new Date().toISOString(),
  };

  dummyDb = newDB;

  return { ok: true };
}

export async function updateDB2(attrs: {
  gapi: typeof gapi;
  google: typeof google;
  db: DB;
}) {
  const accessToken = await requestGapiAccessToken({
    gapi: attrs.gapi,
    google: attrs.google,
    clientId: GAPI_CLIENT_ID,
    scope: GAPI_SCOPE,
    skipConsentOnNoToken: true,
  });

  const dbElInfo = await getGoogleDriveElementInfo({
    path: GAPI_DB_PATH,
    gapi: attrs.gapi,
    accessToken: accessToken.access_token,
  });

  const dbFileId = dbElInfo?.id;

  if (!dbFileId) throw new Error(`DB Does not exist in ${GAPI_DB_PATH}`);

  const newDB: DB = {
    ...attrs.db,
    updatedAt: new Date().toISOString(),
  };

  const resp = await updateGoogleDriveFile({
    accessToken: accessToken.access_token,
    blob: new Blob([JSON.stringify(newDB, undefined, 2)]),
    fileId: dbFileId,
  });

  return resp.json();
}

export async function addAction(attrs: {
  newAction: NewAction;
  gapi: typeof gapi;
  google: typeof google;
}) {
  const db = await getDB({ gapi: attrs.gapi, google: attrs.google });
  const date = new Date().toISOString();
  const id = uuidv4();

  return updateDB({
    gapi,
    google,
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
}) {
  const db = await getDB({ gapi: attrs.gapi, google: attrs.google });
  const date = new Date().toISOString();

  const newActions = db.actions.filter((el) => el.id !== attrs.actionId);
  return updateDB({
    gapi,
    google,
    db: { ...db, updatedAt: date, actions: newActions },
  });
}
