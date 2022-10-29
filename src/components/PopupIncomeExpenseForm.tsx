import { useForm } from 'react-hook-form';
import { ActionType, DB } from '../helpers/DBValidator';

export interface Props {
  db: DB;
  actionType: ActionType;
  value?: string;
  onClose: () => void;
  onSubmit: (value: any) => void;
}

export default function PopupIncomeExpenseForm(props: Props) {
  const { handleSubmit, register } = useForm<{
    value: string;
    type: ActionType;
    expenseCategory?: string;
    incomeCategory?: string;
    description: string;
  }>({
    defaultValues: {
      expenseCategory: undefined,
      incomeCategory: undefined,
      description: '',
    },
  });

  return (
    // TODO: Refactor popup div containers
    <div className="flex fixed inset-0 bg-black justify-center items-center bg-opacity-80">
      <div className="bg-gray-800 py-4 px-5 rounded-lg text-center">
        <h2 className="text-3xl mt-4 mb-4 font-bold">
          <span className="block text-2xl font-normal">
            {props.actionType === 'expense' ? 'Gasto' : 'Ingreso'}
          </span>{' '}
          {props.value || '$0'}
        </h2>

        <form onSubmit={handleSubmit(props.onSubmit)}>
          <input type="hidden" {...register('value', { value: props.value })} />
          <input
            type="hidden"
            {...register('type', { value: props.actionType })}
          />

          <div>
            {props.db[
              props.actionType === 'income'
                ? 'incomeCategories'
                : 'expenseCategories'
            ].map(({ id, name }) => (
              <label key={id} className="relative cursor-pointer">
                <input
                  className="opacity-0 w-1 h-1 absolute top-0 left-0 peer"
                  type="radio"
                  value={`${id}`}
                  {...register(
                    props.actionType === 'income'
                      ? 'incomeCategory'
                      : 'expenseCategory'
                  )}
                />

                <span className="ml-2 mb-2 p-2 inline-block border-2 border-white rounded-lg peer-checked:border-green-500 peer-checked:text-green-500">
                  {name}
                </span>
              </label>
            ))}
          </div>

          <div>
            <input
              className="w-full bg-gray-500 text-white border-2 border-gray-200 placeholder:text-gray-400 text-base p-4 rounded-lg"
              type="text"
              placeholder="Descripción"
              {...register('description')}
            />
          </div>

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
        </form>
      </div>
    </div>
  );
}
