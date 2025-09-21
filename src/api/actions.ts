import { z } from 'zod';
import { DB, dbSchema } from '../helpers/schemas';

import {
  getGoogleDriveFileContent,
  updateGoogleDriveFile,
} from '../helpers/GoogleApi';

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