import { Action, DB, validateDB } from '../helpers/DBValidator';
import { GAPI_CLIENT_ID, GAPI_DB_PATH, GAPI_SCOPE } from '../config';

// https://github.com/uuidjs/uuid/pull/654
import { v4 as uuidv4 } from 'uuid';

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
}) {
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

  return updateDB({
    gapi,
    google,
    db: {
      ...db,
      updatedAt: new Date().toISOString(),
      actions: [
        ...db.actions,
        { ...attrs.newAction, id: uuidv4(), date: new Date().toISOString() },
      ],
    },
  });
}
