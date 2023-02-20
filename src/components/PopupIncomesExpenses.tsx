import { useRef, useState } from 'react';
import { useForm, UseFormReset } from 'react-hook-form';
import { Action, ActionType, DB, ActionCategory } from '../helpers/DBHelpers';
import { sortByDateFnCreator } from '../helpers/general';
import {
  getFilteredBy as lsGetFilteredBy,
  setFilteredBy as lsSetFilteredBy,
} from '../helpers/localStorage';
import {
  getFirstDayOfMonthDate,
  getLastDayOfMonthDate,
  getFormattedLocalDatetime,
  getDatetimeLocalFormattedForInputDate,
  getNextMonthFirstDayDate,
  getPreviousMonthFirstDayDate,
  getFormattedLocalDate,
} from '../helpers/time';
import { formatNumberValueToCurrency } from './Calculator';
import Popup from './Popup';
import PopupFilterByDates from './PopupFilterByDates';

export type Props = {
  db: DB;
  actionType: ActionType;
  onItemDelete: (actionId: Action['id']) => void;
  onEditItemSubmit: (action: Action) => void;
  onClose: () => void;
};

function getCategoryName(db: DB, action: Action) {
  const { type, expenseCategory, incomeCategory } = action;
  const category = db[
    type === 'expense' ? 'expenseCategories' : 'incomeCategories'
  ].find(
    (el) => el.id === (type === 'expense' ? expenseCategory : incomeCategory)
  );

  return category?.name || '-';
}

function getAction({
  action,
  editingItemId,
  reset,
  setEditingItemId,
  getEditingItemForm,
  props,
  manuallySubmitForm,
}: {
  action: Action;
  props: Props;
  editingItemId?: string;
  reset: UseFormReset<Action>;
  setEditingItemId: React.Dispatch<React.SetStateAction<string | undefined>>;
  getEditingItemForm: (action: Action) => JSX.Element | undefined;
  manuallySubmitForm: () => void;
}) {
  return (
    <div
      key={action.id}
      className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center"
    >
      <div className="grow mr-2 break-words min-w-0">
        {editingItemId !== action.id && (
          <>
            <span className="block">
              {formatNumberValueToCurrency(String(action.value))}
              <span className="c-description">
                <span> </span> {getCategoryName(props.db, action)}
              </span>
            </span>
            <span className="block c-description">{action.description}</span>
            <span className="block c-description not-italic">
              {getFormattedLocalDatetime(new Date(action.date))}
            </span>
          </>
        )}

        {getEditingItemForm(action)}
      </div>

      <div className="flex gap-2 max-h-10">
        {editingItemId !== action.id && (
          <>
            <button
              className="btn-success p-0 text-2xl h-10 aspect-square"
              onClick={() => {
                reset();
                setEditingItemId(action.id);
              }}
            >
              ✎
            </button>
            <button
              className="btn-danger p-0 text-2xl h-10 aspect-square"
              onClick={async () => {
                const resp = window.confirm(
                  `Seguro que quieres eliminar este ${
                    action.type === 'expense' ? 'gasto' : 'ingreso'
                  } (${getCategoryName(
                    props.db,
                    action
                  )} - ${formatNumberValueToCurrency(
                    String(action.value)
                  )} - ${getFormattedLocalDatetime(new Date(action.date))})?`
                );

                if (!resp) return;
                props.onItemDelete(action.id);
              }}
            >
              🗑
            </button>
          </>
        )}

        {editingItemId === action.id && (
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
  );
}

function filterActionsByTypeAndStartEndDates(
  attrs: { actionType: ActionType; startDate: Date; endDate: Date },
  action: Action
) {
  const actionDate = new Date(action.date);

  return (
    action.type === attrs.actionType &&
    actionDate >= attrs.startDate &&
    actionDate <= attrs.endDate
  );
}

export default function PopupIncomesExpenses(props: Props) {
  const today = new Date();
  const itemFormRef = useRef<HTMLFormElement | null>(null);
  const [showFilterByDatesPopup, setShowFilterByDatesPopup] = useState(false);
  const [filterBy, setFilterBy] = useState(lsGetFilteredBy());
  const [editingItemId, setEditingItemId] = useState<string>();
  const [{ filterStartDate, filterEndDate }, setFilterDates] = useState({
    filterStartDate: getFirstDayOfMonthDate(today),
    filterEndDate: getLastDayOfMonthDate(today),
  });

  const { register, handleSubmit, reset } = useForm<Action>({
    shouldUnregister: true,
  });

  const categories =
    props.actionType === 'expense'
      ? props.db.expenseCategories
      : props.db.incomeCategories;

  const title = props.actionType === 'expense' ? 'Gastos' : 'Ingresos';

  const filteredActions = props.db.actions
    .filter(
      filterActionsByTypeAndStartEndDates.bind(null, {
        actionType: props.actionType,
        startDate: filterStartDate,
        endDate: filterEndDate,
      })
    )
    .sort(sortByDateFnCreator('date', false));

  const filteredTotal = filteredActions.reduce((acc, el) => acc + el.value, 0);

  let filteredByCaterogies: (ActionCategory & { actions: Action[] })[] = [];

  if (filterBy === 'categories')
    filteredByCaterogies = categories
      .map((cat) => ({
        ...cat,
        actions: props.db.actions
          .filter(
            (action) =>
              action[
                props.actionType === 'expense'
                  ? 'expenseCategory'
                  : 'incomeCategory'
              ] === cat.id
          )
          .filter(
            filterActionsByTypeAndStartEndDates.bind(null, {
              actionType: props.actionType,
              startDate: filterStartDate,
              endDate: filterEndDate,
            })
          )
          .sort(sortByDateFnCreator('date', false)),
      }))
      .sort(sortByDateFnCreator('name'))
      .sort(sortByDateFnCreator('sortPriority', false));

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
    const {
      id,
      value,
      type,
      expenseCategory,
      incomeCategory,
      date,
      description,
    } = action;

    if (editingItemId !== id) return;

    const expenseIncomeCategoryName =
      type === 'expense' ? 'expenseCategory' : 'incomeCategory';
    const expenseIncomeCategoryVal =
      type === 'expense' ? expenseCategory : incomeCategory;
    const selectOptions =
      props.db[type === 'expense' ? 'expenseCategories' : 'incomeCategories'];

    return (
      <form
        name={new Date().toISOString()}
        onSubmit={handleSubmit(handleItemFormSubmit)}
        ref={itemFormRef}
      >
        <input
          className="mb-1"
          type="hidden"
          {...register('id', { value: id })}
        />
        <input
          className="mb-1 block"
          placeholder="Valor"
          {...register('value', { value, valueAsNumber: true })}
          type="number"
        />
        <select
          placeholder="Categoría"
          className="mb-1"
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
          className="mb-1 block"
          type="text"
          placeholder="Descripción"
          {...register('description', { value: description })}
        />
        <input
          className="mb-1 block w-full"
          {...register('date', {
            value: getDatetimeLocalFormattedForInputDate(new Date(date)),
            setValueAs: (val) =>
              (val ? new Date(val) : new Date()).toISOString(),
          })}
          type="datetime-local"
        />
        <button type="submit" hidden />
      </form>
    );
  };

  return (
    <>
      <Popup
        title={title}
        bottomArea={
          <>
            <div className="mb-4 text-lg font-bold">
              Total: {formatNumberValueToCurrency(String(filteredTotal))}
            </div>

            <div className="flex items-center gap-2 justify-between capitalize">
              <button
                onClick={() =>
                  setFilterDates({
                    filterStartDate:
                      getPreviousMonthFirstDayDate(filterStartDate),
                    filterEndDate: getLastDayOfMonthDate(
                      getPreviousMonthFirstDayDate(filterStartDate)
                    ),
                  })
                }
              >
                ←
              </button>
              <button
                type="button"
                className="!px-2"
                onClick={() => setShowFilterByDatesPopup(true)}
              >
                {getFormattedLocalDate(filterStartDate)}
                <br />
                {getFormattedLocalDate(filterEndDate)}
              </button>
              <button
                onClick={() =>
                  setFilterDates({
                    filterStartDate: getNextMonthFirstDayDate(filterStartDate),
                    filterEndDate: getLastDayOfMonthDate(
                      getNextMonthFirstDayDate(filterStartDate)
                    ),
                  })
                }
              >
                →
              </button>
            </div>

            <div className="pt-4">
              <button
                className="mr-2"
                onClick={() => {
                  const newFilterBy =
                    filterBy === 'date' ? 'categories' : 'date';
                  setFilterBy(newFilterBy);
                  lsSetFilteredBy(newFilterBy);
                }}
              >
                Filtro: {filterBy === 'date' ? 'fecha' : 'categorías'}
              </button>
              <button onClick={props.onClose}>Cerrar</button>
            </div>
          </>
        }
      >
        {filterBy === 'categories' && (
          <>
            {filteredByCaterogies.map((item) => (
              <div
                key={item.id + filterStartDate + filterEndDate}
                className="relative"
              >
                <input
                  type="checkbox"
                  className="absolute w-full left-0 top-0 h-8 peer opacity-0"
                />

                <div className="text-left">
                  <p className="border-b border-b-white/10 mb-2 pb-2">
                    <span>{item.name} </span>
                    <span className="text-xs c-description">
                      <span>Items: {item.actions.length}, </span>
                      <span>
                        Total:{' '}
                        {formatNumberValueToCurrency(
                          String(
                            item.actions.reduce((acc, el) => acc + el.value, 0)
                          )
                        )}
                      </span>
                    </span>
                  </p>
                </div>

                <div className="pl-2 mb-5 hidden peer-checked:block">
                  {item.actions.map((item) =>
                    getAction({
                      action: item,
                      props,
                      getEditingItemForm,
                      manuallySubmitForm,
                      reset,
                      setEditingItemId,
                      editingItemId,
                    })
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {filterBy === 'date' && (
          <>
            {filteredActions.map((item) =>
              getAction({
                action: item,
                props,
                getEditingItemForm,
                manuallySubmitForm,
                reset,
                setEditingItemId,
                editingItemId,
              })
            )}
          </>
        )}
      </Popup>

      {showFilterByDatesPopup && (
        <PopupFilterByDates
          startDate={filterStartDate}
          endDate={filterEndDate}
          onCancelClick={() => setShowFilterByDatesPopup(false)}
          onCurrentMonthClick={() => {
            setShowFilterByDatesPopup(false);
            setFilterDates({
              filterStartDate: getFirstDayOfMonthDate(today),
              filterEndDate: getLastDayOfMonthDate(today),
            });
          }}
          onSubmit={(filterStartDate, filterEndDate) => {
            setFilterDates({ filterStartDate, filterEndDate });
            setShowFilterByDatesPopup(false);
          }}
        />
      )}
    </>
  );
}
