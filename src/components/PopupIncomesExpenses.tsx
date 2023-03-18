import { WithRequired } from '@tanstack/react-query';
import { useState } from 'react';
import { Action, Category, DB, Tag, Wallet } from '../helpers/DBHelpers';
import {
  getCategoryById,
  getCategoryName,
  getWalletName,
  sortByFnCreator,
} from '../helpers/general';
import {
  getFilterBy as lsGetFilteredBy,
  getFilterByExpInc,
  setFilterBy as lsSetFilterdBy,
  setFilterByExpInc as lsSetFilterByExpInc,
} from '../helpers/localStorage';
import {
  getFirstDayOfMonthDate,
  getFormattedLocalDate,
  getFormattedLocalDatetime,
  getLastDayOfMonthDate,
  getMonthDifference,
  getNextMonthFirstDayDate,
  getPreviousMonthFirstDayDate,
} from '../helpers/time';
import { formatNumberValueToCurrency } from './Calculator';
import ItemForm from './ItemForm';
import ItemView from './ItemView';
import Popup from './Popup';
import PopupFilterByDates from './PopupFilterByDates';

interface Props {
  db: DB;
  onItemDelete: (actionId: string) => void;
  onEditItemSubmit: (action: unknown) => void;
  onClose: () => void;
}

function getActionNode({
  action,
  props,
  editingItemId,
  setEditingItemId,
  filterByExpInc,
  handleItemFormSubmit,
}: {
  action: Action;
  props: Props;
  editingItemId?: string;
  setEditingItemId: React.Dispatch<React.SetStateAction<string | undefined>>;
  filterByExpInc: 'expense' | 'income';
  handleItemFormSubmit: (data: unknown) => void;
}) {
  return editingItemId === action.id ? (
    <ItemForm
      className="relative"
      onSubmit={handleItemFormSubmit}
      key={'form' + action.id}
      formItems={[
        {
          name: 'id',
          type: 'input',
          hidden: true,
          value: action.id,
          required: true,
        },
        {
          name: 'type',
          type: 'input',
          hidden: true,
          required: true,
          value: action.type,
        },
        {
          name: 'value',
          type: 'inputNumber',
          label: 'Valor',
          required: true,
          value: action.value,
        },
        {
          name: 'categoryId',
          type: 'select',
          label: 'Categoría',
          value: action.categoryId,
          required: true,
          options: props.db.categories
            .filter((it) => it.type === filterByExpInc)
            .map((it) => ({
              value: it.id,
              label: it.name,
            })),
        },
        // {
        //   name: 'walletId',
        //   type: 'select',
        //   label: 'Bolsillo',
        //   required: true,
        //   value: action.walletId,
        //   options: props.db.wallets
        //     .filter((it) => it.type === filterByExpInc)
        //     .map((it) => ({
        //       value: it.id,
        //       label: it.name,
        //     })),
        // },
        {
          type: 'inputDate',
          name: 'date',
          label: 'Fecha',
          value: action.date,
          required: true,
        },
        {
          name: 'description',
          type: 'input',
          label: 'Descripción',
          value: action.description,
        },
      ]}
      onCancel={() => setEditingItemId(undefined)}
    />
  ) : (
    <ItemView
      key={'view' + action.id}
      id={action.id}
      title={formatNumberValueToCurrency(action.value)}
      description={getCategoryName(props.db.categories, action.categoryId)}
      texts={[
        getFormattedLocalDatetime(action.date),
        action.description ?? undefined,
      ]}
      onEditClick={setEditingItemId}
      onRemoveClick={props.onItemDelete}
    />
  );
}

function getActionsBy<K extends keyof Pick<Action, 'date' | 'value'>>(attrs: {
  actions: Action[];
  categories: Category[];
  startDate?: Date | string;
  endDate?: Date | string;
  type?: 'income' | 'expense';
  categoryIds?: string[];
  walletIds?: string[];
  sortBy?: [K, boolean?];
}) {
  const { actions, startDate, endDate, categories } = attrs;
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

    const actionWalletId = getCategoryById(
      categories,
      action.categoryId
    )?.walletId;

    const isOfWalletId =
      actionWalletId && walletIds && walletIds.length > 0
        ? walletIds.includes(actionWalletId)
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
  attrs: {
    startDate: Date | string;
    endDate: Date | string;
    categories: Category[];
  }
) {
  const { startDate, endDate, categories } = attrs;

  const {
    filteredActions: expenseActions,
    filteredActionsTotal: expActionsTotal,
    valuePerMonth: expActionsPerMonth,
  } = getActionsInfo({
    actions: allActions,
    categories,
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
    categories,
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
  const [showFilterByDatesPopup, setShowFilterByDatesPopup] = useState(false);
  const [filterBy, setFilterBy] = useState(lsGetFilteredBy());
  const [filterByExpInc, setFilterByExpInc] = useState(getFilterByExpInc());
  const [editingItemId, setEditingItemId] = useState<string>();
  const [{ filterStartDate, filterEndDate }, setFilterDates] = useState({
    filterStartDate: getFirstDayOfMonthDate(today),
    filterEndDate: getLastDayOfMonthDate(today),
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

  const handleItemFormSubmit = (data: unknown) => {
    setEditingItemId(undefined);
    props.onEditItemSubmit(data);
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
    categories: props.db.categories,
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
                { label: 'Fechas', filterBy: 'date' },
                { label: 'Categorías', filterBy: 'categories' },
                { label: 'Bolsillos', filterBy: 'wallets' },
                { label: 'Etiquetas', filterBy: 'tags' },
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
        ? visibleActions.map((action) =>
            getActionNode({
              action,
              editingItemId,
              setEditingItemId,
              filterByExpInc,
              props,
              handleItemFormSubmit,
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
              categories: props.db.categories,
              startDate: filterStartDate,
              endDate: filterEndDate,
              categoryIds,
              walletIds,
              expectedPerMonth: item.expectedPerMonth,
              sortBy: ['date', false],
            });

            const trackedActionsInfo = getActionsInfo({
              actions: visibleActions,
              categories: props.db.categories,
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
                      {filterBy === 'tags' && categoryIds ? (
                        <span className="block">
                          Categorías ({categoryIds.length}):{' '}
                          {categoryIds
                            .map((id) =>
                              getCategoryName(props.db.categories, id)
                            )
                            .join(', ')}
                        </span>
                      ) : null}
                      {filterBy === 'tags' && walletIds ? (
                        <span className="block">
                          Bolsillos ({walletIds.length}):{' '}
                          {walletIds
                            .map((id) =>
                              getWalletName(props.db.wallets, id).split(', ')
                            )
                            .join(', ')}
                        </span>
                      ) : null}
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

                  {dateFilteredActionsInfo.filteredActions.map((action) =>
                    getActionNode({
                      action,
                      editingItemId,
                      setEditingItemId,
                      filterByExpInc,
                      props,
                      handleItemFormSubmit,
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
