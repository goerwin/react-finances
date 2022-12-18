import { useForm } from 'react-hook-form';
import { getDateFormattedForInput } from '../helpers/time';

export type Props = {
  startDate: Date;
  endDate: Date;
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
    <div className="flex fixed inset-0 bg-black justify-center items-center bg-opacity-80 p-4">
      <div className="bg-gray-800 py-4 px-5 rounded-lg text-center w-full">
        <h2 className="text-3xl mb-4 font-bold">Filtro por fecha</h2>

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
            <button type="button" onClick={props.onCurrentMonthClick}>
              Mes actual
            </button>
            <button
              type="button"
              onClick={() => props.onSubmit(new Date(0), new Date())}
            >
              Histórico
            </button>
          </div>

          <div className="flex gap-1 justify-center">
            <button type="button" onClick={props.onCancelClick}>
              Cancelar
            </button>
            <button className="btn-success">Aceptar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
