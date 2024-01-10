import { useForm } from 'react-hook-form';
import LoadingElement from './LoadingElement';
import Popup from './Popup';
import { TokenInfo, updateInitialBalance } from '../api/actions';
import { useMutation } from '@tanstack/react-query';
import { handleErrorWithNotifications } from '../helpers/general';
import toast from 'react-hot-toast';
import { LSDB } from '../helpers/localStorage';

export interface Props {
  lsDb: LSDB;
  tokenInfo: TokenInfo;
  onDBSync: (data?: LSDB) => void;
  onClose?: () => void;
}

export default function PopupBalance(props: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { initialBalance: props.lsDb.db.initialBalance },
  });

  const { isLoading, mutate } = useMutation({
    onError: handleErrorWithNotifications,
    mutationFn: async ({ initialBalance }: { initialBalance?: number }) => {
      const db = await updateInitialBalance(props.tokenInfo, {
        gdFileId: props.lsDb.fileId,
        initialBalance,
      });

      props.onDBSync({ ...props.lsDb, db });
      props.onClose?.();
      toast.success('Balance inicial actualizado! 😍');
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutate({ initialBalance: data.initialBalance })
      )}
    >
      <Popup
        title="Saldo"
        autoHeight
        bottomArea={
          <div className="flex gap-1 flex-wrap justify-center">
            <button type="submit" disabled={isLoading}>
              {isLoading ? (
                <LoadingElement style={{ display: 'inline', width: 20 }} />
              ) : (
                'Actualizar'
              )}
            </button>

            <button onClick={props.onClose} type="button" disabled={isLoading}>
              Cerrar
            </button>
          </div>
        }
      >
        <div>
          <input
            type="number"
            className="w-full"
            placeholder="Saldo inicial"
            {...register('initialBalance', {
              required: true,
              valueAsNumber: true,
            })}
          />
          <br />
        </div>
      </Popup>
    </form>
  );
}
