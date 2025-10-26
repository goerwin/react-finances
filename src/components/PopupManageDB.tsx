import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getDB, updateDB } from '../api/actions';
import type { TokenInfo } from '../api/actions';
import { initialDB } from '../helpers/schemas';
import {
  handleErrorWithNotifications,
  downloadDataAsJSON,
} from '../helpers/general';
import {
  deleteGoogleDriveFile,
  getGoogleDriveElementInfo,
  getGoogleDriveElementInfoById,
  uploadGoogleDriveFile,
} from '../helpers/GoogleApi';
import { setLsDB, removeDatabasePath } from '../helpers/localStorage';
import type { LSDB } from '../helpers/localStorage';
import Popup from './Popup';
import Button from './Button';

export interface Props {
  tokenInfo: TokenInfo;
  dbPath: string;
  onClose?: () => void;
  onDBSync: (data?: LSDB) => void;
  currentLsDB?: LSDB;
}

async function getDBFileId(
  tokenInfo: TokenInfo,
  dbPath: string,
): Promise<string> {
  const respPath = await getGoogleDriveElementInfo(tokenInfo, { path: dbPath });
  const fileId = respPath?.id;
  if (!fileId) throw new Error('DB_NOT_FOUND');
  return fileId;
}

export default function PopupManageDB({
  tokenInfo,
  dbPath,
  currentLsDB,
  ...props
}: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { dbPath },
  });

  // handle import DB from Google Drive
  const { isLoading: isImportDBLoading, mutate: importDBMutate } = useMutation({
    onError: handleErrorWithNotifications,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      if (
        !confirm(
          `Seguro de importar la base de datos "${dbPath}" desde Google Drive?`,
        )
      )
        return;

      const fileId = await getDBFileId(tokenInfo, dbPath);
      const respInfo = await getGoogleDriveElementInfoById(tokenInfo, {
        gdElementId: fileId,
      });

      if (!respInfo.data.isAppAuthorized) throw new Error('APP_NOT_AUTHORIZED');

      const db = await getDB(tokenInfo, { gdFileId: fileId });

      toast.success('Base de datos importada desde Google Drive! 😉');
      props.onDBSync?.({ fileId, path: dbPath, db });
      props.onClose?.();
    },
  });

  // handle create DB
  const { isLoading: isCreateDBLoading, mutate: createDBMutate } = useMutation({
    onError: handleErrorWithNotifications,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      const dbPathParts = dbPath.split('/');
      const filename = dbPathParts.pop() || '';
      const dirPath = dbPathParts.join('/');

      // verify dbPath does not exist
      try {
        // if this passes, then db already exists!
        await getDBFileId(tokenInfo, dbPath);
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

  // handle export localStorage to Google Drive
  const { isLoading: isSyncDBLoading, mutate: syncDBMutate } = useMutation({
    onError: handleErrorWithNotifications,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      if (
        !confirm(
          `Seguro de exportar los datos locales a "${dbPath}" en Google Drive?`,
        )
      )
        return;

      if (!currentLsDB?.db)
        throw new Error('No hay datos locales para exportar');

      const fileId = await getDBFileId(tokenInfo, dbPath);
      const updatedDB = await updateDB(tokenInfo, {
        gdFileId: fileId,
        db: currentLsDB.db,
      });

      toast.success('Datos locales exportados a Google Drive! 🚀');
      props.onDBSync?.({ ...currentLsDB, db: updatedDB });
      props.onClose?.();
    },
  });

  const handleLocalExport = () => {
    if (!currentLsDB?.db) {
      toast.error('No hay datos locales para exportar');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `finances-backup-${timestamp}.json`;
    downloadDataAsJSON(currentLsDB.db, filename);
    toast.success('Datos exportados localmente! 📁');
  };

  const handleLocalImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const target = e.target instanceof HTMLInputElement ? e.target : null;

      if (!target) return;

      const file = target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result !== 'string') {
            toast.error('Error al leer el archivo');
            return;
          }
          const data = JSON.parse(result);
          // Validate the data structure (basic check)
          if (
            data &&
            typeof data === 'object' &&
            data.actions &&
            data.categories &&
            data.tags
          ) {
            toast.success('Datos importados localmente! 📁');
            props.onDBSync?.({
              ...currentLsDB,
              db: data,
              path: currentLsDB?.path || 'local-import',
              fileId: currentLsDB?.fileId || 'local-import',
            });
            props.onClose?.();
          } else {
            toast.error('El archivo no tiene el formato correcto');
          }
        } catch {
          toast.error('Error al leer el archivo');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // handle delete DB
  const { isLoading: isDeleteDBLoading, mutate: deleteDBMutate } = useMutation({
    onError: handleErrorWithNotifications,
    mutationFn: async ({ dbPath }: { dbPath: string }) => {
      if (
        !confirm(
          `Seguro de eliminar la base de datos "${dbPath}" tanto local como de Google Drive?`,
        )
      )
        return;

      const fileId = await getDBFileId(tokenInfo, dbPath);
      await deleteGoogleDriveFile(tokenInfo, { gdFileId: fileId });

      // Also clear localStorage
      setLsDB();
      removeDatabasePath();

      toast.success('Base de datos eliminada completamente! 😭');
      props.onDBSync?.();
      props.onClose?.();
    },
  });

  const isLoading =
    isCreateDBLoading ||
    isImportDBLoading ||
    isDeleteDBLoading ||
    isSyncDBLoading;

  return (
    <form onSubmit={handleSubmit((data) => importDBMutate(data))}>
      <Popup
        title="Gestionar DB"
        autoHeight
        bottomArea={
          <div className="flex flex-wrap justify-center gap-1">
            <Button
              disabled={isLoading}
              showLoading={isImportDBLoading}
              onClick={handleSubmit((data) => importDBMutate(data))}
            >
              Importar
            </Button>

            <Button
              disabled={isLoading || !currentLsDB?.db}
              showLoading={isSyncDBLoading}
              onClick={handleSubmit((data) => syncDBMutate(data))}
            >
              Exportar
            </Button>

            <Button
              disabled={isLoading || !currentLsDB?.db}
              onClick={handleLocalExport}
            >
              Exportar Local
            </Button>

            <Button disabled={isLoading} onClick={handleLocalImport}>
              Importar Local
            </Button>

            <Button
              disabled={isLoading}
              showLoading={isCreateDBLoading}
              onClick={handleSubmit((data) => createDBMutate(data))}
            >
              Crear
            </Button>

            <Button
              disabled={isLoading}
              showLoading={isDeleteDBLoading}
              onClick={handleSubmit((data) => deleteDBMutate(data))}
            >
              Eliminar
            </Button>

            <Button onClick={props.onClose}>Cerrar</Button>
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
