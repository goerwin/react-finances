import { LOCAL_STORAGE_NAMESPACE } from '../config';
import { arrayIncludes } from './general';
import { TokenInfoSchema, TokenInfo } from '../api/actions';
import { dbSchema, DB } from './schemas';
import { z } from 'zod';

const Keys = {
  filteredBy: `${LOCAL_STORAGE_NAMESPACE}_filteredBy`,
  tokenInfo: `${LOCAL_STORAGE_NAMESPACE}_ti`,
  db: `${LOCAL_STORAGE_NAMESPACE}_db`,
  filterByExpInc: `${LOCAL_STORAGE_NAMESPACE}_filterByExpInc`,
  databasePath: `${LOCAL_STORAGE_NAMESPACE}_databasePath`,
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

const filterByOpts = ['date', 'categories', 'tags', 'wallets'] as const;
type FilterByOptions = (typeof filterByOpts)[number];

export function setFilterBy(filteredBy: FilterByOptions) {
  localStorage.removeItem(Keys.filteredBy);
  localStorage.setItem(Keys.filteredBy, filteredBy);
}

export function getFilterBy(): FilterByOptions {
  const filteredBy = localStorage.getItem(Keys.filteredBy);
  return arrayIncludes(filterByOpts, filteredBy) ? filteredBy : 'date';
}

const filterByExpIncOpts = ['expense', 'income'] as const;
type FilterByExpInc = (typeof filterByExpIncOpts)[number];

export function setFilterByExpInc(filter: FilterByExpInc) {
  localStorage.removeItem(Keys.filterByExpInc);
  localStorage.setItem(Keys.filterByExpInc, filter);
}

export function getFilterByExpInc(): FilterByExpInc {
  const filter = localStorage.getItem(Keys.filterByExpInc);
  return arrayIncludes(filterByExpIncOpts, filter) ? filter : 'expense';
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

export function getDatabasePath() {
  return localStorage.getItem(Keys.databasePath);
}

export function setDatabasePath(dbPath?: string) {
  if (!dbPath) return;
  localStorage.setItem(Keys.databasePath, dbPath);
}

export function removeDatabaePath() {
  localStorage.removeItem(Keys.databasePath);
}
