import { LOCAL_STORAGE_NAMESPACE } from '../config';
import { arrayIncludes } from './general';
import { z } from 'zod';
import { TokenInfoSchema, TokenInfo } from '../api/actions';

const Keys = {
  fileId: `${LOCAL_STORAGE_NAMESPACE}_dbFileId`,
  filteredBy: `${LOCAL_STORAGE_NAMESPACE}_filteredBy`,
  tokenInfo: `${LOCAL_STORAGE_NAMESPACE}_ti`,
};

export function setGDFileId(fileId: unknown) {
  if (typeof fileId !== 'string') return localStorage.removeItem(Keys.fileId);
  localStorage.setItem(Keys.fileId, fileId);
}

export function getGDFileId() {
  const fileId = localStorage.getItem(Keys.fileId);
  return typeof fileId === 'string' ? fileId : undefined;
}

export function getTokenInfo() {
  const tokenInfo = localStorage.getItem(Keys.tokenInfo);
  return tokenInfo ? TokenInfoSchema.parse(JSON.parse(tokenInfo)) : undefined;
}

export function setTokenInfo(tokenInfo: TokenInfo | undefined) {
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
