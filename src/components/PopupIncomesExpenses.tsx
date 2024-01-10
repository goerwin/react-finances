import { WithRequired } from '@tanstack/react-query';
import { useState } from 'react';
import { Action, Category, DB, Tag, Wallet } from '../helpers/schemas';
import {
  getCategoryById,
  getCategoryName,
  getWalletCategories,
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
        {
          name: 'trackOnly',
          type: 'checkbox',
          label: 'Seguimiento (🦶)',
          value: action.trackOnly,
        },
        {
          name: 'withCreditCard',
          type: 'checkbox',
          label: 'TC (💳)',
          value: action.withCreditCard,
        },
      ]}
      onCancel={() => setEditingItemId(undefined)}
    />
  ) : (
    <ItemView
      key={'view' + action.id}
      id={action.id}
      trackOnly={action.trackOnly}
      withCreditCard={action.withCreditCard}
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

  const actions = getActionsBy(attrs);
  const { total, totalOnlyTrack, totalOnlyCreditCard } = actions.reduce<{
    total: number;
    totalOnlyTrack: number;
    totalOnlyCreditCard: number;
  }>(
    (action, i) => {
      return {
        ...action,
        totalOnlyTrack: i.trackOnly
          ? action.totalOnlyTrack + i.value
          : action.totalOnlyTrack,
        total: action.total + (i.trackOnly ? 0 : i.value),
        totalOnlyCreditCard: i.withCreditCard
          ? action.totalOnlyCreditCard + i.value
          : action.totalOnlyCreditCard,
      };
    },
    { totalOnlyTrack: 0, totalOnlyCreditCard: 0, total: 0 }
  );

  const monthDiff = getMonthDifference(endDate, startDate);
  const totalWithTrack = totalOnlyTrack + total;

  const valuePerMonth = total / monthDiff;
  const valuePerMonthWithTrack = totalWithTrack / monthDiff;

  const deviationFromExpected = (expectedPerMonth ?? 0) * monthDiff - total;
  const deviationFromExpectedWithTrack =
    (expectedPerMonth ?? 0) * monthDiff - totalWithTrack;

  return {
    startDate,
    endDate,
    monthDiff,
    total,
    totalOnlyTrack,
    totalWithTrack,
    totalOnlyCreditCard,
    valuePerMonth,
    valuePerMonthWithTrack,
    expectedPerMonth,
    deviationFromExpected,
    deviationFromExpectedWithTrack,
    actions,
  };
}

function getActionsGroupInfoNode(
  attrs: ReturnType<typeof getActionsInfo> & {
    resumed?: boolean;
  }
) {
  if (attrs.resumed)
    return (
      <>
        {`(${attrs.actions.length})`}
        {' - T: '}
        {formatNumberValueToCurrency(attrs.total)}
        {' - TcS: '}
        {formatNumberValueToCurrency(attrs.totalWithTrack)}
      </>
    );

  return (
    <>
      {attrs.expectedPerMonth ? (
        <span className="block c-description">
          Estimado Mensual:{' '}
          {formatNumberValueToCurrency(attrs.expectedPerMonth)}
        </span>
      ) : null}

      <span className="block c-description">
        Rango: {getFormattedLocalDate(attrs.startDate)}
        {' - '}
        {getFormattedLocalDate(attrs.endDate)} (Meses: {attrs.monthDiff})
      </span>

      <span className="block c-description">
        T: {formatNumberValueToCurrency(attrs.total)}
        {' - M: '} {formatNumberValueToCurrency(attrs.valuePerMonth)}
        {' - D: '} {formatNumberValueToCurrency(attrs.deviationFromExpected)}
      </span>

      <span className="block c-description">
        S: {formatNumberValueToCurrency(attrs.totalOnlyTrack)}
      </span>

      <span className="block c-description">
        TcS: {formatNumberValueToCurrency(attrs.totalWithTrack)}
        {' - McS: '} {formatNumberValueToCurrency(attrs.valuePerMonthWithTrack)}
        {' - DcS: '}{' '}
        {formatNumberValueToCurrency(attrs.deviationFromExpectedWithTrack)}
      </span>
    </>
  );
}

function getActionsDates(actions: Action[]) {
  return actions.reduce<{ initialDate: Date; finalDate: Date }>(
    (prev, curr) => {
      const actionDate = new Date(curr.date);

      return {
        initialDate:
          actionDate < prev.initialDate ? actionDate : prev.initialDate,
        finalDate: actionDate > prev.finalDate ? actionDate : prev.finalDate,
      };
    },
    { initialDate: new Date(), finalDate: new Date(0) }
  );
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
    actions: expenseActions,
    total: expActionsTotal,
    totalOnlyTrack: expTrackOnlyTotal,
    totalWithTrack: expActionsTotalWithTrack,
    valuePerMonth: expActionsPerMonth,
    totalOnlyCreditCard: expTotalOnlyCreditCard,
    valuePerMonthWithTrack: expActionsPerMonthWithTrack,
  } = getActionsInfo({
    actions: allActions,
    categories,
    type: 'expense',
    startDate,
    endDate,
    sortBy: ['date', false],
  });

  const {
    actions: incomeActions,
    total: incActionsTotal,
    totalOnlyTrack: incTrackOnlyTotal,
    totalWithTrack: incActionsTotalWithTrack,
    valuePerMonth: incActionsPerMonth,
    valuePerMonthWithTrack: incActionsPerMonthWithTrack,
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
    incActionsTotalWithTrack,
    expActionsTotal,
    expActionsTotalWithTrack,
    expTrackOnlyTotal,
    incTrackOnlyTotal,
    expTotalOnlyCreditCard,
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

  const { initialDate, finalDate } = getActionsDates(props.db.actions);

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

  const { total: historicExpenseTotal } = getActionsInfo({
    actions: props.db.actions,
    categories: props.db.categories,
    type: 'expense',
    startDate: initialDate,
    endDate: finalDate,
  });

  const {
    incomeActions: filteredIncomeActions,
    expenseActions: filteredExpenseActions,
    monthDiff: filteredMonthDiff,
    diffTotal: filteredDiffTotal,
    expActionsTotal: filteredExpActionsTotal,
    incActionsTotal: filteredIncActionsTotal,
    expActionsPerMonth: filteredExpActionsPerMonth,
    incActionsPerMonth: filteredIncActionsPerMonth,
    diffPerMonth: filteredDiffPerMonth,
    expTrackOnlyTotal: filteredExpActionsPerMonthOnlyTrack,
    incTrackOnlyTotal: filteredIncActionsTotalOnlyTrack,
    expTotalOnlyCreditCard,
  } = getActionsIncExpInfo(props.db.actions, {
    categories: props.db.categories,
    startDate: filterStartDate,
    endDate: filterEndDate,
  });

  const filteredVisibleActions =
    filterByExpInc === 'expense'
      ? filteredExpenseActions
      : filteredIncomeActions;

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
          <div className="mb-2 text-sm italic c-description overflow-auto">
            <p>
              Gastos: T: {formatNumberValueToCurrency(filteredExpActionsTotal)}
              {' - M: '}
              {formatNumberValueToCurrency(filteredExpActionsPerMonth)}
            </p>
            <p>
              Ingresos: T:{' '}
              {formatNumberValueToCurrency(filteredIncActionsTotal)}
              {' - M: '}
              {formatNumberValueToCurrency(filteredIncActionsPerMonth)}
            </p>
            <p>
              Diff.: T: {formatNumberValueToCurrency(filteredDiffTotal)}
              {' - M: '}
              {formatNumberValueToCurrency(filteredDiffPerMonth)}
            </p>

            <p>Meses: {filteredMonthDiff}</p>

            <p>
              Seg: GT:{' '}
              {formatNumberValueToCurrency(filteredExpActionsPerMonthOnlyTrack)}
              {' - '}
              IT:{' '}
              {formatNumberValueToCurrency(filteredIncActionsTotalOnlyTrack)}
            </p>
            <p>
              TC: {formatNumberValueToCurrency(expTotalOnlyCreditCard)} - Saldo:{' '}
              {formatNumberValueToCurrency(
                historicExpenseTotal -
                  (props.db.initialBalance ?? historicExpenseTotal)
              )}
            </p>
          </div>

          <div className="relative before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-5 before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)] pb-2" />

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
                { label: 'Gastos', filterBy: 'expense' },
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
        ? filteredVisibleActions.map((action) =>
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
            console.log('bb', item);
            const categoryIds =
              filterBy === 'tags'
                ? item.categoryIds
                : filterBy === 'categories'
                ? [item.id]
                : getWalletCategories(item.id, props.db.categories).map(
                    (it) => it.id
                  );
            const walletIds =
              filterBy === 'wallets'
                ? [item.id]
                : filterBy === 'tags'
                ? item.walletIds
                : undefined;

            const dateFilteredActionsInfo = getActionsInfo({
              actions: filteredVisibleActions,
              categories: props.db.categories,
              startDate: filterStartDate,
              endDate: filterEndDate,
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
                      {getActionsGroupInfoNode({
                        ...dateFilteredActionsInfo,
                        resumed: true,
                      })}
                    </span>
                  </p>
                </div>

                <div className="pl-2 mb-5 hidden peer-checked:block">
                  <div className="text-left relative mb-2">
                    <span className="block text-xs c-description">
                      {(filterBy === 'tags' || filterBy === 'wallets') &&
                      categoryIds ? (
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

                      {getActionsGroupInfoNode({
                        ...dateFilteredActionsInfo,
                      })}
                    </span>
                  </div>

                  {dateFilteredActionsInfo.actions.map((action) =>
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
