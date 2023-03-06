import { useRef, useState } from 'react';
import { useForm, UseFormReset } from 'react-hook-form';
import {
  Action,
  ActionType,
  DB,
  ActionCategory,
  Tag,
} from '../helpers/DBHelpers';
import { sortByFnCreator } from '../helpers/general';
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
  getMonthDifference,
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
              {formatNumberValueToCurrency(action.value)}
              <span className="c-description">
                <span> </span> {getCategoryName(props.db, action)}
              </span>
            </span>
            <span className="block c-description">{action.description}</span>
            <span className="block c-description not-italic">
              {getFormattedLocalDatetime(action.date)}
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
                    action.value
                  )} - ${getFormattedLocalDatetime(action.date)})?`
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
  attrs: {
    actionType: ActionType;
    startDate: Date | string;
    endDate: Date | string;
  },
  action: Action
) {
  const actionDate = new Date(action.date);

  return (
    action.type === attrs.actionType &&
    actionDate >= new Date(attrs.startDate) &&
    actionDate <= new Date(attrs.endDate)
  );
}

function getCategoryActionsInfo(attrs: {
  startDate: string | Date;
  endDate: string | Date;
  actionType: ActionType;
  expectedPerMonth: number;
  actionCategoryKey: 'incomeCategory' | 'expenseCategory';
  actionCategories: string[];
  allCategories: ActionCategory[];
  allActions: Action[];
}) {
  const { startDate, endDate, allActions, actionType, actionCategories } =
    attrs;
  const { expectedPerMonth, actionCategoryKey, allCategories } = attrs;

  const parsedCategories = actionCategories
    .map((catId) => ({ ...allCategories.find((cat) => cat.id === catId) }))
    .filter((el): el is ActionCategory => !!el.id);

  const filteredActions = allActions
    .filter((ac) => actionCategories.includes(ac[actionCategoryKey] ?? ''))
    .filter(
      filterActionsByTypeAndStartEndDates.bind(null, {
        actionType,
        startDate,
        endDate,
      })
    );

  const filteredActionsTotal = filteredActions.reduce(
    (acc, it) => acc + it.value,
    0
  );
  const monthDiff = getMonthDifference(endDate, startDate);
  const averageValuePerMonth = filteredActionsTotal / monthDiff;
  const deviationFromExpected =
    expectedPerMonth * monthDiff - filteredActionsTotal;

  return {
    startDate,
    endDate,
    monthDiff,
    filteredActionsTotal,
    averageValuePerMonth,
    deviationFromExpected,
    parsedCategories,
    filteredActions,
  };
}

function getCategoryActionsInfoEl(
  attrs: ReturnType<typeof getCategoryActionsInfo> & {
    omitRange?: boolean;
    prefix?: string;
  }
) {
  return (
    <>
      {attrs.omitRange ? null : (
        <span className="block c-description">
          Rango: {getFormattedLocalDate(attrs.startDate)}
          {' - '}
          {getFormattedLocalDate(attrs.endDate)} (Meses: {attrs.monthDiff})
        </span>
      )}

      <span className="block c-description">
        {attrs.prefix ?? ''}
        T: {formatNumberValueToCurrency(attrs.filteredActionsTotal)}, M:{' '}
        {formatNumberValueToCurrency(attrs.averageValuePerMonth)}, D:{' '}
        {formatNumberValueToCurrency(attrs.deviationFromExpected)}
      </span>
    </>
  );
}

function getInitialDate(actions: Action[]) {
  const action = actions.reduce<Action | null>(
    (prev, curr) =>
      !prev ? curr : new Date(curr.date) < new Date(prev.date) ? curr : prev,
    null
  );

  return new Date(action?.date || 0);
}

function getFinalDate(actions: Action[]) {
  const action = actions.reduce<Action | null>(
    (prev, curr) =>
      !prev ? curr : new Date(curr.date) > new Date(prev.date) ? curr : prev,
    null
  );

  return new Date(action?.date || 0);
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

  const [initialDate, finalDate] = [
    getInitialDate(props.db.actions),
    getFinalDate(props.db.actions),
  ];

  const { register, handleSubmit, reset } = useForm<Action>({
    shouldUnregister: true,
  });

  const allCategories =
    props.actionType === 'expense'
      ? props.db.expenseCategories
      : props.db.incomeCategories;

  const actionCategoryKey =
    props.actionType === 'expense' ? 'expenseCategory' : 'incomeCategory';

  const title = props.actionType === 'expense' ? 'Gastos' : 'Ingresos';

  const filteredActions = props.db.actions
    .filter(
      filterActionsByTypeAndStartEndDates.bind(null, {
        actionType: props.actionType,
        startDate: filterStartDate,
        endDate: filterEndDate,
      })
    )
    .sort(sortByFnCreator('date', false));

  const filteredTotal = filteredActions.reduce((acc, el) => acc + el.value, 0);

  // filterBy categories

  let filteredByCaterogies: (ActionCategory & {
    actions: Action[];
    filteredBy: 'categories';
  })[] = [];

  if (filterBy === 'categories')
    filteredByCaterogies = allCategories
      .map((cat) => ({
        ...cat,
        filteredBy: 'categories' as const,
        actions: props.db.actions
          .filter((action) => action[actionCategoryKey] === cat.id)
          .filter(
            filterActionsByTypeAndStartEndDates.bind(null, {
              actionType: props.actionType,
              startDate: filterStartDate,
              endDate: filterEndDate,
            })
          )
          .sort(sortByFnCreator('date', false)),
      }))
      .sort(sortByFnCreator('name'))
      .sort(sortByFnCreator('sortPriority', false));

  // filterBy tags

  const tags = (
    props.actionType === 'expense' ? props.db.expenseTags : props.db.incomeTags
  )
    .map((el) => ({ ...el, filteredBy: 'tags' as const }))
    .sort(sortByFnCreator('sortPriority', false));

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
            <div className="mb-2 text-base font-bold">
              Total: {formatNumberValueToCurrency(filteredTotal)}
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
                className="!px-2 text-xs leading-none"
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

            <div className="pt-2">
              <button className="mr-2" onClick={props.onClose}>
                Cerrar
              </button>
              <button
                onClick={() => {
                  const newFilterBy =
                    filterBy === 'date'
                      ? 'categories'
                      : filterBy === 'categories'
                      ? 'tags'
                      : 'date';

                  setFilterBy(newFilterBy);
                  lsSetFilteredBy(newFilterBy);
                }}
              >
                Filtro: {filterBy}
              </button>
            </div>
          </>
        }
      >
        {filterBy === 'date'
          ? filteredActions.map((item) =>
              getAction({
                action: item,
                props,
                getEditingItemForm,
                manuallySubmitForm,
                reset,
                setEditingItemId,
                editingItemId,
              })
            )
          : null}

        {filterBy === 'tags' || filterBy === 'categories'
          ? (filterBy === 'tags' ? tags : filteredByCaterogies).map((item) => {
              const filteredBy = item.filteredBy;
              const actionCategories =
                filteredBy === 'tags' ? item.categories : [item.id];

              const dateFilteredCategoryActionsInfo = getCategoryActionsInfo({
                actionType: props.actionType,
                allActions: props.db.actions,
                allCategories,
                actionCategoryKey,
                actionCategories,
                expectedPerMonth: item.expectedPerMonth ?? 0,
                startDate: filterStartDate,
                endDate: filterEndDate,
              });

              const startDateCategoryActionsInfo = getCategoryActionsInfo({
                actionType: props.actionType,
                allActions: props.db.actions,
                allCategories,
                actionCategoryKey,
                actionCategories: actionCategories,
                expectedPerMonth: item.expectedPerMonth ?? 0,
                startDate: item.startDate ?? initialDate,
                endDate: today,
              });

              return (
                <div
                  key={item.id + filterStartDate + filterEndDate}
                  className="relative"
                >
                  <input
                    type="checkbox"
                    className="absolute w-full left-0 top-0 h-full peer opacity-0"
                  />

                  <div className="text-left">
                    <p className="border-b border-b-white/10 mb-2 pb-1">
                      <span>{item.name} </span>
                      <span className="c-description">
                        {filteredBy === 'tags' ? (
                          <span>
                            {'('}
                            {
                              dateFilteredCategoryActionsInfo.filteredActions
                                .length
                            }
                            {') T: '}
                            {formatNumberValueToCurrency(
                              dateFilteredCategoryActionsInfo.filteredActionsTotal
                            )}
                            {', D: '}
                            {formatNumberValueToCurrency(
                              dateFilteredCategoryActionsInfo.deviationFromExpected
                            )}
                          </span>
                        ) : (
                          <span>
                            {'Items: '}
                            {
                              dateFilteredCategoryActionsInfo.filteredActions
                                .length
                            }
                            {', Total: '}
                            {formatNumberValueToCurrency(
                              dateFilteredCategoryActionsInfo.filteredActionsTotal
                            )}
                          </span>
                        )}
                      </span>

                      {filteredBy === 'tags'
                        ? getCategoryActionsInfoEl({
                            ...startDateCategoryActionsInfo,
                            omitRange: true,
                            prefix: 'Seg: ',
                          })
                        : null}
                    </p>
                  </div>

                  <div className="pl-2 mb-5 hidden peer-checked:block">
                    <div className="text-left relative mb-2">
                      <span className="block text-xs c-description">
                        <span className="block">
                          Estimado Mensual:{' '}
                          {formatNumberValueToCurrency(item.expectedPerMonth)}
                        </span>
                        Categorías {`(${actionCategories.length}): `}
                        {dateFilteredCategoryActionsInfo.parsedCategories
                          .map((el) => el.name)
                          .join(', ')}
                      </span>
                      <span className="block">-------</span>
                      {getCategoryActionsInfoEl(startDateCategoryActionsInfo)}
                      <span className="block">-------</span>

                      {getCategoryActionsInfoEl(
                        dateFilteredCategoryActionsInfo
                      )}
                    </div>

                    {dateFilteredCategoryActionsInfo.filteredActions.map(
                      (item) =>
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
              );
            })
          : null}
      </Popup>

      {showFilterByDatesPopup && (
        <PopupFilterByDates
          startDate={filterStartDate}
          endDate={filterEndDate}
          initialDate={initialDate}
          finalDate={finalDate}
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
