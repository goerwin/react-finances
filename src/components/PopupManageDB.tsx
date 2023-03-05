import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getDB, TokenInfo } from '../api/actions';
import { dbSchema, initialDB } from '../helpers/DBHelpers';
import {
  deleteGoogleDriveFile,
  getGoogleDriveElementInfo,
  getGoogleDriveElementInfoById,
  uploadGoogleDriveFile,
} from '../helpers/GoogleApi';
import { LSDB } from '../helpers/localStorage';
import LoadingElement from './LoadingElement';
import Popup from './Popup';

export interface Props {
  tokenInfo: TokenInfo;
  dbPath: string;
  onDBSync?: (data?: LSDB) => void;
  onClose?: () => void;
}

const LoadingForBtn = (
  <LoadingElement style={{ display: 'inline', width: 20 }} />
);

async function getDBFileId(
  tokenInfo: TokenInfo,
  dbPath: string
): Promise<string> {
  const respPath = await getGoogleDriveElementInfo(tokenInfo, { path: dbPath });
  const fileId = respPath?.id;
  if (!fileId) throw new Error('DB_NOT_FOUND');
  return fileId;
}

// TODO: Probably global helper
function handleError(err: unknown) {
  let message = '';

  if (!(err instanceof Error)) message = 'Error inesperado';
  else if (err.message === 'DB_NOT_FOUND') message = 'DB No encontrada';
  else if (err.message === 'APP_NOT_AUTHORIZED')
    message = 'Esta App no está autorizada para usar esta DB';
  else if (err.message === 'DB_ALREADY_EXISTS_CANT_CREATE')
    message = 'DB ya existe';
  else if (err.message === 'DB_PARENT_DIR_NOT_FOUND')
    message = 'Directorio no encontrado';
  else message = `Error general: ${err.message}`;

  toast(message, { type: 'error', autoClose: false });
}

export default function PopupManageDB({ tokenInfo, dbPath, ...props }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { dbPath },
  });

  // handle verify DB
  const { isLoading: isVerifyDBLoading, mutate: verifyDBMutate } = useMutation({
    onError: handleError,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      const fileId = await getDBFileId(tokenInfo, dbPath);
      const respInfo = await getGoogleDriveElementInfoById(tokenInfo, {
        gdElementId: fileId,
      });

      if (!respInfo.data.isAppAuthorized) throw new Error('APP_NOT_AUTHORIZED');

      const db = await getDB(tokenInfo, { gdFileId: fileId });

      toast.success('Base de datos actualizada! 😉');
      props.onDBSync?.({ fileId, path: dbPath, db });
      props.onClose?.();
    },
  });

  // handle create DB
  const { isLoading: isCreateDBLoading, mutate: createDBMutate } = useMutation({
    onError: handleError,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      const dbPathParts = dbPath.split('/');
      const filename = dbPathParts.pop() || '';
      const dirPath = dbPathParts.join('/');

      // verify dbPath does not exist
      try {
        // if this passes, then db already exists!
        void (await getDBFileId(tokenInfo, dbPath));
        throw new Error('DB_ALREADY_EXISTS_CANT_CREATE');
      } catch (err) {
        if (!(err instanceof Error)) throw err;
        if (err.message !== 'DB_NOT_FOUND') throw err;
      }

      // verify parent dir exists
      const respPath = await getGoogleDriveElementInfo(tokenInfo, {
        path: dirPath,
      });
      const dbParentDirId = respPath?.id;
      if (!dbParentDirId) throw new Error('DB_PARENT_DIR_NOT_FOUND');

      // try creating the new DB
      const resp = await uploadGoogleDriveFile(tokenInfo, {
        parents: [dbParentDirId],
        mimeType: 'application/json',
        name: filename,
        blob: new Blob([JSON.stringify(initialDB)]),
      });

      toast.success('Base de datos creada! 😍');
      props.onClose?.();
      props.onDBSync?.({ db: initialDB, path: dbPath, fileId: resp.data.id });
    },
  });

  // handle delete DB
  const { isLoading: isDeleteDBLoading, mutate: deleteDBMutate } = useMutation({
    onError: handleError,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      if (!confirm(`Seguro de eliminar la base de datos "${dbPath}"?`)) return;

      const fileId = await getDBFileId(tokenInfo, dbPath);
      void (await deleteGoogleDriveFile(tokenInfo, { gdFileId: fileId }));
      toast.success('Base de datos eliminada! 😭');
      props.onDBSync?.();
      props.onClose?.();
    },
  });

  const isLoading = isCreateDBLoading || isVerifyDBLoading || isDeleteDBLoading;

  return (
    <form onSubmit={handleSubmit((data) => verifyDBMutate(data))}>
      <Popup
        title="Gestionar DB"
        autoHeight
        bottomArea={
          <div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit((data) => verifyDBMutate(data))}
            >
              {isVerifyDBLoading ? LoadingForBtn : null}
              Actualizar DB
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit((data) => createDBMutate(data))}
            >
              {isCreateDBLoading ? LoadingForBtn : null}
              Crear DB
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit((data) => deleteDBMutate(data))}
            >
              {isDeleteDBLoading ? LoadingForBtn : null}
              Eliminar DB
            </button>

            <button onClick={props.onClose} type="button">
              Cerrar
            </button>
          </div>
        }
      >
        <div>
          <input
            type="text"
            className="w-full"
            placeholder="Path de la base de datos"
            {...register('dbPath', { required: true })}
          />
          <br />
        </div>
      </Popup>
    </form>
  );
}
