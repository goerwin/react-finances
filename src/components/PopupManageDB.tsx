import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { TokenInfo } from '../api/actions';
import {
  deleteGoogleDriveFile,
  getGoogleDriveElementInfo,
  getGoogleDriveElementInfoById,
} from '../helpers/GoogleApi';
import LoadingElement from './LoadingElement';
import Popup from './Popup';

export interface Props {
  tokenInfo: TokenInfo;
  dbPath: string;
  onDBChange: (data: { fileId: string; path: string }) => void;
}

const LoadingForBtn = (
  <LoadingElement style={{ display: 'inline', width: 20 }} />
);

async function usableDB(tokenInfo: TokenInfo, dbPath: string) {
  const respPath = await getGoogleDriveElementInfo(tokenInfo, {
    path: dbPath,
  });

  const fileId = respPath?.id;

  if (!fileId) throw new Error('DB_NOT_FOUND');

  const respInfo = await getGoogleDriveElementInfoById(tokenInfo, {
    gdElementId: fileId,
  });

  if (!respInfo.data.isAppAuthorized) throw new Error('APP_NOT_AUTHORIZED');

  return { fileId, path: dbPath };
}

// TODO: Probably global helper
function handleError(err: unknown) {
  let message = '';
  if (!(err instanceof Error)) message = 'Ocurrió un error';
  else if (err.message === 'DB_NOT_FOUND') message = 'DB No encontrada';
  else if (err.message === 'APP_NOT_AUTHORIZED')
    message = 'Esta App no está authorizada para usar esta DB';

  toast(message, { type: 'error' });
}

export default function PopupManageDB({ tokenInfo, dbPath, ...props }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { dbPath },
  });

  const { isLoading, mutate } = useMutation({
    onError: handleError,
    mutationFn: async (data: { dbPath: string }) => {
      const newDB = await usableDB(tokenInfo, data.dbPath);
      props.onDBChange(newDB);
    },
  });

  const handleCreate = (data: { dbPath: string }) => {
    console.log(data);
  };

  const anotherMutation = async (data: { dbPath: string }) => {
    const { fileId } = await usableDB(tokenInfo, data.dbPath);
    deleteGoogleDriveFile(tokenInfo, { fileId });
  };

  return (
    <form onSubmit={handleSubmit(handleCreate)}>
      <Popup
        title="Gestionar DB"
        autoHeight
        bottomArea={
          <div>
            {/* <button type="button" onClick={handleSubmit(handleUpdate)}> */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit((data) => mutate(data))}
            >
              {isLoading ? LoadingForBtn : null}
              Actualizar DB
            </button>
            <button type="button" onClick={handleSubmit(handleCreate)}>
              Crear DB
            </button>
            <button type="button">Eliminar DB</button>
            <button type="button">Cerrar</button>
          </div>
        }
      >
        <div>
          <input type="text" {...register('dbPath', { required: true })} />
          <br />
        </div>
      </Popup>
    </form>
  );
}
