import { LOCAL_STORAGE_NAMESPACE } from '../config';
import { arrayIncludes } from './general';
import { TokenInfoSchema, TokenInfo } from '../api/actions';
import { dbSchema, DB } from './DBHelpers';
import { z } from 'zod';

const Keys = {
  filteredBy: `${LOCAL_STORAGE_NAMESPACE}_filteredBy`,
  tokenInfo: `${LOCAL_STORAGE_NAMESPACE}_ti`,
  db: `${LOCAL_STORAGE_NAMESPACE}_db`,
};

function safeGetLSItem(key: string) {
  try {
    const lsItem = localStorage.getItem(key);
    return lsItem ? JSON.parse(lsItem) : undefined;
  } catch (err) {
    return undefined;
  }
}

export function getTokenInfo() {
  const res = TokenInfoSchema.safeParse(safeGetLSItem(Keys.tokenInfo));
  return res.success ? res.data : undefined;
}

export function setTokenInfo(tokenInfo?: TokenInfo) {
  tokenInfo
    ? localStorage.setItem(Keys.tokenInfo, JSON.stringify(tokenInfo))
    : localStorage.removeItem(Keys.tokenInfo);
}

const filteredOptions = ['date', 'categories'] as const;

export function setFilteredBy(filteredBy: typeof filteredOptions[number]) {
  localStorage.removeItem(Keys.filteredBy);
  localStorage.setItem(Keys.filteredBy, filteredBy);
}

export function getFilteredBy(): typeof filteredOptions[number] {
  const filteredBy = localStorage.getItem(Keys.filteredBy);
  return arrayIncludes(filteredOptions, filteredBy) ? filteredBy : 'date';
}

const LSDBSchema = z.object({
  path: z.string(),
  fileId: z.string(),
  db: dbSchema,
});

export type LSDB = z.infer<typeof LSDBSchema>;

export function getLsDB() {
  const res = LSDBSchema.safeParse(safeGetLSItem(Keys.db));
  return res.success ? res.data : undefined;
}

export function setLsDB(lsDB?: LSDB) {
  lsDB
    ? localStorage.setItem(Keys.db, JSON.stringify(lsDB))
    : localStorage.removeItem(Keys.db);
}
