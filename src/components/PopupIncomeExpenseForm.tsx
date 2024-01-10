import { useForm } from 'react-hook-form';
import { Action, ItemType, DB } from '../helpers/schemas';
import { sortByFnCreator } from '../helpers/general';
import { removeCurrencyFormattingToValue } from './Calculator';
import Popup from './Popup';

export interface Props {
  db: DB;
  actionType: ItemType;
  value?: string;
  onClose: () => void;
  onSubmit: (value: Action) => void;
}

export default function PopupIncomeExpenseForm(props: Props) {
  const { handleSubmit, register } = useForm<Action>({
    defaultValues: {
      id: 'new',
      categoryId: '',
      description: '',
      date: new Date().toISOString(),
    },
  });

  const categories = props.db.categories
    .filter((it) => it.type === props.actionType)
    .sort(sortByFnCreator('name'));

  return (
    <form onSubmit={handleSubmit(props.onSubmit)}>
      <Popup
        popupClassName="items-end"
        autoHeight
        title={props.actionType === 'expense' ? 'Gasto' : 'Ingreso'}
        subtitle={props.value || '$0'}
        bottomArea={
          <>
            <div className="flex gap-2 justify-center mt-2">
              <button
                type="button"
                onClick={props.onClose}
                className="btn-danger"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-success">
                Aceptar
              </button>
            </div>
          </>
        }
      >
        <input
          type="hidden"
          {...register('value', {
            value: Number(removeCurrencyFormattingToValue(props.value || '')),
            valueAsNumber: true,
          })}
        />
        <input
          type="hidden"
          {...register('type', { value: props.actionType })}
        />

        <div className="mb-2">
          <input
            className="w-full bg-gray-500 text-white border-2 border-gray-200 placeholder:text-gray-400 text-base p-4 rounded-lg"
            type="text"
            placeholder="Descripción"
            {...register('description')}
          />
        </div>

        <div className="flex flex-wrap justify-center">
          {categories.map(({ id, name }) => (
            <label key={id} className="relative cursor-pointer">
              <input
                className="opacity-0 w-1 h-1 absolute top-0 left-0 peer"
                type="radio"
                value={`${id}`}
                {...register('categoryId', { required: true })}
              />

              <span className="ml-2 mb-2 p-2 inline-block border-2 border-white rounded-lg peer-checked:border-green-500 peer-checked:text-green-500">
                {name}
              </span>
            </label>
          ))}
        </div>

        <div className="p-2">
          <label>
            <span className="align-middle">Seguimiento (🦶): </span>
            <input
              type="checkbox"
              className="align-middle h-4 w-4"
              {...register('trackOnly')}
            />
          </label>
        </div>
        <div className="p-2">
          <label>
            <span className="align-middle">TC (💳): </span>
            <input
              type="checkbox"
              className="align-middle h-4 w-4"
              {...register('withCreditCard')}
            />
          </label>
        </div>
      </Popup>
    </form>
  );
}
