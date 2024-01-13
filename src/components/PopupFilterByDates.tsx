import { useForm } from 'react-hook-form';
import { getDateFormattedForInput } from '../helpers/time';
import Popup from './Popup';
import Button from './Button';

export type Props = {
  startDate: Date;
  endDate: Date;
  initialDate: Date;
  finalDate: Date;
  onCurrentMonthClick: () => void;
  onCancelClick: () => void;
  onSubmit: (startDate: Date, endDate: Date) => void;
};

export default function PopupFilterByDates(props: Props) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      startDate: getDateFormattedForInput(props.startDate),
      endDate: getDateFormattedForInput(props.endDate),
    },
  });

  const handleFormSubmit = (data: typeof formState.defaultValues) => {
    if (!data?.endDate || !data?.startDate) return;

    props.onSubmit(new Date(data.startDate), new Date(data.endDate));
  };

  return (
    <Popup title="Filtro por fecha" autoHeight>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <fieldset className="mb-2">
          <label>Inicio: </label>
          <input
            type="date"
            {...register('startDate', {
              required: true,
              // val is yyyy-MM-dd
              // append T00:00 to convert it to local date
              setValueAs: (val) => new Date(val + 'T00:00'),
            })}
          />
        </fieldset>

        <fieldset className="mb-2">
          <label>Fin: </label>
          <input
            type="date"
            {...register('endDate', {
              required: true,
              setValueAs: (val) =>
                // set day to T23:59:59.999Z
                new Date(
                  new Date(val + 'T00:00').valueOf() + 24 * 60 * 60 * 1000 - 1
                ),
            })}
          />
        </fieldset>

        <div className="flex gap-1 justify-center mb-2">
          <Button onClick={props.onCurrentMonthClick}>Mes actual</Button>
          <Button
            onClick={() => props.onSubmit(props.initialDate, props.finalDate)}
          >
            Histórico
          </Button>
        </div>

        <div className="flex gap-1 justify-center">
          <Button onClick={props.onCancelClick}>Cancelar</Button>
          <Button variant="success">Aceptar</Button>
        </div>
      </form>
    </Popup>
  );
}
