import { LOCAL_STORAGE_NAMESPACE } from '../config';

const Keys = {
  fileId: `${LOCAL_STORAGE_NAMESPACE}_dbFileId`,
};

export function setGDFileId(fileId: any) {
  if (typeof fileId !== 'string') localStorage.removeItem(Keys.fileId);
  localStorage.setItem(Keys.fileId, fileId);
}

export function getGDFileId() {
  const fileId = localStorage.getItem(Keys.fileId);
  return typeof fileId === 'string' ? fileId : undefined;
}
