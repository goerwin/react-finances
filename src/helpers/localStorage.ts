import { LOCAL_STORAGE_NAMESPACE } from '../config';
import { arrayIncludes } from './general';
import { TokenInfoSchema, TokenInfo } from '../api/actions';
import { dbSchema, DB } from './DBHelpers';

const Keys = {
  fileId: `${LOCAL_STORAGE_NAMESPACE}_dbFileId`,
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

export function setGDFileId(fileId?: string) {
  if (typeof fileId !== 'string') return localStorage.removeItem(Keys.fileId);
  localStorage.setItem(Keys.fileId, fileId);
}

export function getGDFileId() {
  const fileId = localStorage.getItem(Keys.fileId);
  return typeof fileId === 'string' ? fileId : undefined;
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

export function getDB() {
  const res = dbSchema.safeParse(safeGetLSItem(Keys.db));
  return res.success ? res.data : undefined;
}

export function setDB(db?: DB) {
  db
    ? localStorage.setItem(Keys.db, JSON.stringify(db))
    : localStorage.removeItem(Keys.db);
}
