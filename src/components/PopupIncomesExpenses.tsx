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
  onActionDelete: (actionId: Action['id']) => void;
  onEditActionSubmit: (action: Action) => void;
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
  const editingFormRef = useRef<HTMLFormElement | null>(null);
  const [date, setDate] = useState(new Date());
  const [editingActionId, setEditingActionId] = useState<string>();

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
    editingFormRef.current?.dispatchEvent(
      new Event('submit', {
        cancelable: true,
        bubbles: true,
      })
    );
  };

  const handleFormSubmit = (action: Action) => {
    setEditingActionId(undefined);
    editingFormRef.current = null;
    props.onEditActionSubmit(action);
  };

  const getEditingForm = (action: Action) => {
    const { register, handleSubmit } = useForm<Action>({
      shouldUnregister: true,
    });

    const { id, value, type, expenseCategory, incomeCategory, date } = action;

    if (editingActionId !== id) return;

    const expenseIncomeCategoryName =
      type === 'expense' ? 'expenseCategory' : 'incomeCategory';
    const expenseIncomeCategoryVal =
      type === 'expense' ? expenseCategory : incomeCategory;
    const selectOptions =
      db[type === 'expense' ? 'expenseCategories' : 'incomeCategories'];

    return (
      <form
        name={new Date().toISOString()}
        onSubmit={handleSubmit(handleFormSubmit)}
        ref={editingFormRef}
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
          {...register('date', { value: getLocalFormattedInputDate(date) })}
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
          {filteredActions.map((act) => (
            <div
              key={act.id}
              className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center"
            >
              <div className="grow mr-2 break-words min-w-0">
                {editingActionId !== act.id && (
                  <>
                    <span className="block">
                      {formatNumberValueToCurrency(String(act.value))}
                    </span>
                    <span className="block">{getCategoryName(db, act)}</span>
                    <span className="block">
                      {getLocalFormattedDate(act.date)}
                    </span>
                    {act.description && (
                      <span className="block">{act.description}</span>
                    )}
                  </>
                )}

                {getEditingForm(act)}
              </div>

              <div className="flex gap-2 max-h-10">
                {editingActionId !== act.id && (
                  <>
                    <button
                      className="btn-success p-0 text-2xl h-10 aspect-square"
                      onClick={() => setEditingActionId(act.id)}
                    >
                      ✎
                    </button>
                    <button
                      className="btn-danger p-0 text-2xl h-10 aspect-square"
                      onClick={async () => {
                        const resp = window.confirm(
                          `Seguro que quieres eliminar este ingreso (${getCategoryName(
                            db,
                            act
                          )} - ${formatNumberValueToCurrency(
                            String(act.value)
                          )} - ${getLocalFormattedDate(act.date)})?`
                        );

                        if (!resp) return;
                        props.onActionDelete(act.id);
                      }}
                    >
                      🗑
                    </button>
                  </>
                )}

                {editingActionId === act.id && (
                  <>
                    <button
                      className="btn-success p-0 text-2xl h-10 aspect-square"
                      onClick={manuallySubmitForm}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-danger p-0 text-2xl h-10 aspect-square"
                      onClick={() => setEditingActionId(undefined)}
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
