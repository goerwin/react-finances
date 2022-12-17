import { LOCAL_STORAGE_NAMESPACE } from '../config';
import { arrayIncludes } from './general';

const Keys = {
  fileId: `${LOCAL_STORAGE_NAMESPACE}_dbFileId`,
  filteredBy: `${LOCAL_STORAGE_NAMESPACE}_filteredBy`,
};

export function setGDFileId(fileId: any) {
  if (typeof fileId !== 'string') localStorage.removeItem(Keys.fileId);
  localStorage.setItem(Keys.fileId, fileId);
}

export function getGDFileId() {
  const fileId = localStorage.getItem(Keys.fileId);
  return typeof fileId === 'string' ? fileId : undefined;
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
