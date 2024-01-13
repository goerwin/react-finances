import { useForm } from 'react-hook-form';
import Popup from './Popup';
import { TokenInfo, updateInitialBalance } from '../api/actions';
import { useMutation } from '@tanstack/react-query';
import { handleErrorWithNotifications } from '../helpers/general';
import toast from 'react-hot-toast';
import { LSDB } from '../helpers/localStorage';
import Button from './Button';

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
            <Button type="submit" disabled={isLoading} showLoading={isLoading}>
              Actualizar
            </Button>

            <Button onClick={props.onClose}>Cerrar</Button>
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