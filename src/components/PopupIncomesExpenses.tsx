import { WithRequired } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm, UseFormReset } from 'react-hook-form';
import { Action, DB, Category, Tag, Wallet } from '../helpers/DBHelpers';
import { sortByFnCreator } from '../helpers/general';
import {
  getFilterByExpInc,
  getFilterBy as lsGetFilteredBy,
  setFilterBy as lsSetFilterdBy,
  setFilterByExpInc as lsSetFilterByExpInc,
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

interface Props {
  db: DB;
  onItemDelete: (actionId: Action['id']) => void;
  onEditItemSubmit: (action: Action) => void;
  onClose: () => void;
}

function getCategoryName(categories: Category[], categoryId: string) {
  return categories.find((el) => el.id === categoryId)?.name || '-';
}

function getWalletName(wallets: Wallet[], walletId: string) {
  return wallets.find((it) => it.id === walletId)?.name ?? '-';
}

function getActionNode({
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
                {' '}
                {getCategoryName(props.db.categories, action.categoryId)}
              </span>
            </span>
            <span className="block c-description">{action.description}</span>
            <span className="block c-description not-italic">
              {getFormattedLocalDatetime(action.date)}
              {' / Bolsillo: '}
              {getWalletName(props.db.wallets, action.walletId)}
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
                    props.db.categories,
                    action.categoryId
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

function getActionsBy<K extends keyof Pick<Action, 'date' | 'value'>>(attrs: {
  actions: Action[];
  startDate?: Date | string;
  endDate?: Date | string;
  type?: 'income' | 'expense';
  categoryIds?: string[];
  walletIds?: string[];
  sortBy?: [K, boolean?];
}) {
  const { actions, startDate, endDate } = attrs;
  const { type, categoryIds, walletIds, sortBy } = attrs;

  const filteredActions = actions.filter((action) => {
    const actionDate = new Date(action.date);
    const isOfType = type ? action.type === type : true;

    const isInDateRange =
      startDate && endDate
        ? actionDate >= new Date(startDate) && actionDate <= new Date(endDate)
        : true;

    const isOfCategoryId =
      categoryIds && categoryIds.length > 0
        ? categoryIds.includes(action.categoryId)
        : true;

    const isOfWalletId =
      walletIds && walletIds.length > 0
        ? walletIds.includes(action.walletId)
        : true;

    return isOfType && isInDateRange && isOfCategoryId && isOfWalletId;
  });

  return sortBy
    ? filteredActions.sort(sortByFnCreator(...sortBy))
    : filteredActions;
}

function getActionsInfo(
  attrs: WithRequired<
    Parameters<typeof getActionsBy>[0],
    'startDate' | 'endDate'
  > & { expectedPerMonth?: number }
) {
  const { startDate, endDate, expectedPerMonth } = attrs;

  const filteredActions = getActionsBy(attrs);
  const filteredActionsTotal = filteredActions.reduce((t, i) => t + i.value, 0);
  const monthDiff = getMonthDifference(endDate, startDate);
  const valuePerMonth = filteredActionsTotal / monthDiff;
  const deviationFromExpected =
    (expectedPerMonth ?? 0) * monthDiff - filteredActionsTotal;

  return {
    startDate,
    endDate,
    monthDiff,
    filteredActionsTotal,
    valuePerMonth,
    deviationFromExpected,
    filteredActions,
  };
}

function getActionsGroupInfoNode(attrs: {
  startDate: Date | string;
  endDate: Date | string;
  monthDiff: number;
  total: number;
  valuePerMonth: number;
  deviationFromExpected: number;
  omitRange?: boolean;
  prefix?: string;
}) {
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
        T: {formatNumberValueToCurrency(attrs.total)}, M:{' '}
        {formatNumberValueToCurrency(attrs.valuePerMonth)}, D:{' '}
        {formatNumberValueToCurrency(attrs.deviationFromExpected)}
      </span>
    </>
  );
}

function getActionsInitialDate(actions: Action[]) {
  const action = actions.reduce<Action | null>(
    (prev, curr) =>
      !prev ? curr : new Date(curr.date) < new Date(prev.date) ? curr : prev,
    null
  );

  return new Date(action?.date || 0);
}

function getActionsFinalDate(actions: Action[]) {
  const action = actions.reduce<Action | null>(
    (prev, curr) =>
      !prev ? curr : new Date(curr.date) > new Date(prev.date) ? curr : prev,
    null
  );

  return new Date(action?.date || 0);
}

function getActionsIncExpInfo(
  allActions: Action[],
  attrs: { startDate: Date | string; endDate: Date | string }
) {
  const { startDate, endDate } = attrs;

  const {
    filteredActions: expenseActions,
    filteredActionsTotal: expActionsTotal,
    valuePerMonth: expActionsPerMonth,
  } = getActionsInfo({
    actions: allActions,
    type: 'expense',
    startDate,
    endDate,
    sortBy: ['date', false],
  });

  const {
    filteredActions: incomeActions,
    filteredActionsTotal: incActionsTotal,
    valuePerMonth: incActionsPerMonth,
    monthDiff,
  } = getActionsInfo({
    actions: allActions,
    type: 'income',
    startDate,
    endDate,
    sortBy: ['date', false],
  });

  return {
    incomeActions,
    expenseActions,
    incActionsTotal,
    expActionsTotal,
    diffTotal: incActionsTotal - expActionsTotal,
    incActionsPerMonth,
    expActionsPerMonth,
    diffPerMonth: incActionsPerMonth - expActionsPerMonth,
    monthDiff,
  };
}

export default function PopupIncomesExpenses(props: Props) {
  const today = new Date();
  const itemFormRef = useRef<HTMLFormElement | null>(null);
  const [showFilterByDatesPopup, setShowFilterByDatesPopup] = useState(false);
  const [filterBy, setFilterBy] = useState(lsGetFilteredBy());
  const [filterByExpInc, setFilterByExpInc] = useState(getFilterByExpInc());
  const [editingItemId, setEditingItemId] = useState<string>();
  const [{ filterStartDate, filterEndDate }, setFilterDates] = useState({
    filterStartDate: getFirstDayOfMonthDate(today),
    filterEndDate: getLastDayOfMonthDate(today),
  });
  const { register, handleSubmit, reset } = useForm<Action>({
    shouldUnregister: true,
  });

  const [initialDate, finalDate] = [
    getActionsInitialDate(props.db.actions),
    getActionsFinalDate(props.db.actions),
  ];

  const syncFilterByExpInc = (filter: typeof filterByExpInc) => {
    setFilterByExpInc(filter);
    lsSetFilterByExpInc(filter);
  };

  const syncFilterBy = (filter: typeof filterBy) => {
    setFilterBy(filter);
    lsSetFilterdBy(filter);
  };

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
    const { id, value, date, description } = action;
    const { categoryId, walletId } = action;

    if (editingItemId !== id) return;

    const categories = props.db.categories;

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
          className="block mb-1"
          {...register('categoryId', { required: true, value: categoryId })}
        >
          <option key="empty" value="" disabled>
            Categoría
          </option>
          {categories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <select
          placeholder="Bolsillo"
          className="block mb-1"
          {...register('walletId', {
            value: walletId,
          })}
        >
          <option key="empty" value="" disabled>
            Bolsillo
          </option>
          {props.db.wallets.map((option) => (
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

  const {
    incomeActions,
    expenseActions,
    monthDiff,
    diffTotal,
    expActionsTotal,
    incActionsTotal,
    expActionsPerMonth,
    incActionsPerMonth,
    diffPerMonth,
  } = getActionsIncExpInfo(props.db.actions, {
    startDate: filterStartDate,
    endDate: filterEndDate,
  });

  const visibleActions =
    filterByExpInc === 'expense' ? expenseActions : incomeActions;

  const visibleGroups: SafeIntersection<
    SafeIntersection<Wallet, Category>,
    Tag
  >[] =
    filterBy === 'categories'
      ? props.db.categories
          .filter((it) => it.type === filterByExpInc)
          .sort(sortByFnCreator('sortPriority', false))
      : filterBy === 'tags'
      ? props.db.tags
          .filter((it) => it.type === filterByExpInc)
          .sort(sortByFnCreator('sortPriority', false))
      : filterBy === 'wallets'
      ? props.db.wallets
          .filter((it) => it.type === filterByExpInc)
          .sort(sortByFnCreator('sortPriority', false))
      : [];

  return (
    <Popup
      title="Entradas"
      bottomArea={
        <>
          <div className="mb-2 text-sm italic c-description">
            <p>
              Gastos: T: {formatNumberValueToCurrency(expActionsTotal)}, M:{' '}
              {formatNumberValueToCurrency(expActionsPerMonth)}
            </p>
            <p>
              Ingresos: T: {formatNumberValueToCurrency(incActionsTotal)}, M:{' '}
              {formatNumberValueToCurrency(incActionsPerMonth)}
            </p>
            <p>
              Diferencia: T: {formatNumberValueToCurrency(diffTotal)}, M:{' '}
              {formatNumberValueToCurrency(diffPerMonth)}
            </p>
            <p>Meses: {monthDiff}</p>
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

          <div className="grid grid-cols-4 mt-1 gap-px">
            {(
              [
                { label: 'Fecha', filterBy: 'date' },
                { label: 'Categoría', filterBy: 'categories' },
                { label: 'Etiqueta', filterBy: 'tags' },
                { label: 'Bolsillo', filterBy: 'wallets' },
              ] as const
            ).map((it, idx) => (
              <button
                className={`!text-xs !p-2 !py-4 !rounded-none !bg-black/40 ${
                  it.filterBy === filterBy ? '!bg-green-900' : ''
                }`}
                type="button"
                key={idx}
                onClick={() => syncFilterBy(it.filterBy)}
              >
                {it.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-px">
            {(
              [
                { label: 'Ingresos', filterBy: 'income' },
                { label: 'Gasos', filterBy: 'expense' },
              ] as const
            ).map((it, idx) => (
              <button
                type="button"
                className={`!text-xs !p-2 !py-4 !rounded-none ${
                  it.filterBy === filterByExpInc
                    ? '!bg-green-900'
                    : '!bg-black/20'
                }`}
                key={idx}
                onClick={() => syncFilterByExpInc(it.filterBy)}
              >
                {it.label}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button className="mr-2" onClick={props.onClose}>
              Cerrar
            </button>
          </div>
        </>
      }
    >
      {filterBy === 'date'
        ? visibleActions.map((item) =>
            getActionNode({
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

      {filterBy !== 'date'
        ? visibleGroups.map((item) => {
            const categoryIds =
              filterBy === 'tags'
                ? item.categoryIds
                : filterBy === 'categories'
                ? [item.id]
                : undefined;
            const walletIds =
              filterBy === 'wallets'
                ? [item.id]
                : filterBy === 'tags'
                ? item.walletIds
                : undefined;

            const dateFilteredActionsInfo = getActionsInfo({
              actions: visibleActions,
              startDate: filterStartDate,
              endDate: filterEndDate,
              categoryIds,
              walletIds,
              expectedPerMonth: item.expectedPerMonth,
              sortBy: ['date', false],
            });

            const trackedActionsInfo = getActionsInfo({
              actions: visibleActions,
              startDate: item.startDate ?? initialDate,
              endDate: finalDate,
              categoryIds,
              walletIds,
              expectedPerMonth: item.expectedPerMonth,
              sortBy: ['date', false],
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
                      {filterBy === 'categories' ? (
                        <span>
                          {'Items: '}
                          {dateFilteredActionsInfo.filteredActions.length}
                          {', Total: '}
                          {formatNumberValueToCurrency(
                            dateFilteredActionsInfo.filteredActionsTotal
                          )}
                        </span>
                      ) : (
                        <span>
                          {`(${
                            dateFilteredActionsInfo.filteredActions.length
                          }) T: ${formatNumberValueToCurrency(
                            dateFilteredActionsInfo.filteredActionsTotal
                          )}, D: ${formatNumberValueToCurrency(
                            dateFilteredActionsInfo.deviationFromExpected
                          )}`}

                          {getActionsGroupInfoNode({
                            ...trackedActionsInfo,
                            total: trackedActionsInfo.filteredActionsTotal,
                            omitRange: true,
                            prefix: 'Seg: ',
                          })}
                        </span>
                      )}
                    </span>
                  </p>
                </div>

                <div className="pl-2 mb-5 hidden peer-checked:block">
                  <div className="text-left relative mb-2">
                    <span className="block text-xs c-description">
                      <span className="block">
                        Estimado Mensual:{' '}
                        {formatNumberValueToCurrency(item.expectedPerMonth)}
                      </span>
                    </span>
                    <span className="block">-------</span>
                    {getActionsGroupInfoNode({
                      ...trackedActionsInfo,
                      total: trackedActionsInfo.filteredActionsTotal,
                    })}
                    <span className="block">-------</span>
                    {getActionsGroupInfoNode({
                      ...dateFilteredActionsInfo,
                      total: dateFilteredActionsInfo.filteredActionsTotal,
                    })}
                  </div>

                  {dateFilteredActionsInfo.filteredActions.map((item) =>
                    getActionNode({
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
    </Popup>
  );
}
