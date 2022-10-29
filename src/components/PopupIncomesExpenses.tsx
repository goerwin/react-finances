import { useState } from 'react';
import { Action, ActionType, DB } from '../helpers/DBValidator';
import { getLocalFormattedDate } from '../helpers/time';
import { formatNumberValueToCurrency } from './Calculator';

export interface Props {
  db: DB;
  actionType: ActionType;
  onActionDelete: (actionId: Action['id']) => void;
  onClose: () => void;
}

function getCategoryName(db: DB, action: Action) {
  const { type, expenseCategory, incomeCategory } = action;
  const category = db[
    type === 'expense' ? 'expenseCategories' : 'incomeCategories'
  ].find(
    (el) => el.id === (type === 'expense' ? expenseCategory : incomeCategory)
  );

  return category?.name || '';
}

function getPreviousMonthDate(date: Date) {
  const localMonth = date.getMonth();
  const localYear = date.getFullYear();

  const newDate = new Date();
  const newLocalMonth = localMonth === 0 ? 11 : localMonth - 1;
  const newLocalYear = localMonth === 0 ? localYear - 1 : localYear;

  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setDate(1);
  newDate.setMonth(newLocalMonth);
  newDate.setFullYear(newLocalYear);

  return newDate;
}

function getNextMonthDate(date: Date) {
  const localMonth = date.getMonth();
  const localYear = date.getFullYear();

  const newDate = new Date();
  const newLocalMonth = localMonth === 11 ? 0 : localMonth + 1;
  const newLocalYear = localMonth === 11 ? localYear + 1 : localYear;

  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setDate(1);
  newDate.setMonth(newLocalMonth);
  newDate.setFullYear(newLocalYear);

  return newDate;
}

export default function PopupIncomesExpenses({ db, ...props }: Props) {
  const title = props.actionType === 'expense' ? 'Gastos' : 'Ingresos';

  const [date, setDate] = useState(new Date());

  const localMonth = date.getMonth();
  const localMonthStr = date.toLocaleString('default', { month: 'long' });
  const localYear = date.getFullYear();

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

  return (
    <div className="flex fixed inset-0 bg-black justify-center items-center bg-opacity-80 p-4">
      <div className="bg-gray-800 py-4 px-5 rounded-lg text-center w-full">
        <h2 className="text-3xl mt-4 mb-4 font-bold">{title}</h2>

        <div className="h-80 overflow-auto">
          {filteredActions.map((el) => (
            <div
              key={el.id}
              className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center"
            >
              <div className="grow mr-2 break-words min-w-0">
                <span className="block">
                  {formatNumberValueToCurrency(String(el.value))}
                </span>
                <span className="block">{getCategoryName(db, el)}</span>
                <span className="block">{getLocalFormattedDate(el.date)}</span>
                {el.description && (
                  <span className="block">{el.description}</span>
                )}
              </div>

              <div className="flex gap-2 max-h-10">
                <button className="btn-success p-0 text-2xl h-10 aspect-square">
                  ✎
                </button>
                <button
                  className="btn-danger p-0 text-2xl h-10 aspect-square"
                  onClick={async () => {
                    const resp = window.confirm(
                      `Seguro que quieres eliminar este ingreso (${getCategoryName(
                        db,
                        el
                      )} - ${formatNumberValueToCurrency(
                        String(el.value)
                      )} - ${getLocalFormattedDate(el.date)})?`
                    );

                    if (!resp) return;
                    props.onActionDelete(el.id);
                  }}
                >
                  🗑
                </button>
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
