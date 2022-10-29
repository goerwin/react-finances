import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Action, ActionType, DB } from '../helpers/DBValidator';
import {
  getLocalFormattedDate,
  getLocalFormattedInputDate,
  getNextMonthDate,
  getPreviousMonthDate,
} from '../helpers/time';
import { formatNumberValueToCurrency } from './Calculator';

export interface Props {
  db: DB;
  actionType: ActionType;
  onItemDelete: (actionId: Action['id']) => void;
  onEditItemSubmit: (action: Action) => void;
  onClose: () => void;
}

function getCategoryName(db: DB, action: Action) {
  const { type, expenseCategory, incomeCategory } = action;
  const category = db[
    type === 'expense' ? 'expenseCategories' : 'incomeCategories'
  ].find(
    (el) => el.id === (type === 'expense' ? expenseCategory : incomeCategory)
  );

  return category?.name || '-';
}

export default function PopupIncomesExpenses({ db, ...props }: Props) {
  const itemFormRef = useRef<HTMLFormElement | null>(null);
  const [date, setDate] = useState(new Date());
  const [editingItemId, setEditingItemId] = useState<string>();

  const { register, handleSubmit, reset } = useForm<Action>({
    shouldUnregister: true,
  });

  const localMonth = date.getMonth();
  const localMonthStr = date.toLocaleString('default', { month: 'long' });
  const localYear = date.getFullYear();

  const title = props.actionType === 'expense' ? 'Gastos' : 'Ingresos';

  const filteredActions = db.actions
    .filter((action) => {
      const actionDate = new Date(action.date);

      return (
        action.type === props.actionType &&
        actionDate.getMonth() === localMonth &&
        localYear === actionDate.getFullYear()
      );
    })
    .sort((el1, el2) => (el1.date <= el2.date ? 1 : -1));

  const filteredTotal = filteredActions.reduce((acc, el) => acc + el.value, 0);

  const manuallySubmitForm = () => {
    itemFormRef.current?.dispatchEvent(
      new Event('submit', {
        cancelable: true,
        bubbles: true,
      })
    );
  };

  const handleItemFormSubmit = (item: Action) => {
    setEditingItemId(undefined);
    itemFormRef.current = null;
    props.onEditItemSubmit(item);
  };

  const getEditingItemForm = (action: Action) => {
    const { id, value, type, expenseCategory, incomeCategory, date } = action;

    if (editingItemId !== id) return;

    const expenseIncomeCategoryName =
      type === 'expense' ? 'expenseCategory' : 'incomeCategory';
    const expenseIncomeCategoryVal =
      type === 'expense' ? expenseCategory : incomeCategory;
    const selectOptions =
      db[type === 'expense' ? 'expenseCategories' : 'incomeCategories'];

    return (
      <form
        name={new Date().toISOString()}
        onSubmit={handleSubmit(handleItemFormSubmit)}
        ref={itemFormRef}
      >
        <input type="hidden" {...register('id', { value: id })} />
        <input
          {...register('value', { value, valueAsNumber: true })}
          type="number"
        />
        <select
          {...register(expenseIncomeCategoryName, {
            value: expenseIncomeCategoryVal,
          })}
        >
          <option key="empty" value="">
            -
          </option>
          {selectOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <input
          {...register('date', {
            value: getLocalFormattedInputDate(date),
            valueAsDate: true,
          })}
          type="datetime-local"
        />
      </form>
    );
  };
  return (
    <div className="flex fixed inset-0 bg-black justify-center items-center bg-opacity-80 p-4">
      <div className="bg-gray-800 py-4 px-5 rounded-lg text-center w-full">
        <h2 className="text-3xl mt-4 mb-4 font-bold">{title}</h2>

        <div className="h-80 overflow-auto">
          {filteredActions.map((item) => (
            <div
              key={item.id}
              className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center"
            >
              <div className="grow mr-2 break-words min-w-0">
                {editingItemId !== item.id && (
                  <>
                    <span className="block">
                      {formatNumberValueToCurrency(String(item.value))}
                    </span>
                    <span className="block">{getCategoryName(db, item)}</span>
                    <span className="block">
                      {getLocalFormattedDate(item.date)}
                    </span>
                    {item.description && (
                      <span className="block">{item.description}</span>
                    )}
                  </>
                )}

                {getEditingItemForm(item)}
              </div>

              <div className="flex gap-2 max-h-10">
                {editingItemId !== item.id && (
                  <>
                    <button
                      className="btn-success p-0 text-2xl h-10 aspect-square"
                      onClick={() => {
                        reset();
                        setEditingItemId(item.id);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      className="btn-danger p-0 text-2xl h-10 aspect-square"
                      onClick={async () => {
                        const resp = window.confirm(
                          `Seguro que quieres eliminar este ${
                            item.type === 'expense' ? 'gasto' : 'ingreso'
                          } (${getCategoryName(
                            db,
                            item
                          )} - ${formatNumberValueToCurrency(
                            String(item.value)
                          )} - ${getLocalFormattedDate(item.date)})?`
                        );

                        if (!resp) return;
                        props.onItemDelete(item.id);
                      }}
                    >
                      🗑
                    </button>
                  </>
                )}

                {editingItemId === item.id && (
                  <>
                    <button
                      className="btn-success p-0 text-2xl h-10 aspect-square"
                      onClick={manuallySubmitForm}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-danger p-0 text-2xl h-10 aspect-square"
                      onClick={() => setEditingItemId(undefined)}
                      dangerouslySetInnerHTML={{ __html: '&times;' }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="relative pt-4 mb-4 text-lg font-bold before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-5 before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)]">
          Total: {formatNumberValueToCurrency(String(filteredTotal))}
        </div>
        <div className="flex items-center gap-2 justify-between">
          <button onClick={() => setDate(getPreviousMonthDate(date))}>←</button>
          <span>
            {localMonthStr} {localYear}
          </span>
          <button onClick={() => setDate(getNextMonthDate(date))}>→</button>
        </div>

        <div className="pt-4">
          <button onClick={props.onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
