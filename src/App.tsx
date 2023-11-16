import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  addItem,
  deleteItem,
  editItem,
  TokenInfo,
  TokenInfoSchema,
} from './api/actions';
import Calculator, {
  formatNumberValueToCurrency,
} from './components/Calculator';
import Loading from './components/Loading';
import PopupCRUD from './components/PopupCRUD';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import PopupManageDB from './components/PopupManageDB';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_SERVER_URL,
  GOOGLE_SCOPE,
  GOOGLE_SERVICE_IDENTITY_CLIENT,
} from './config';
import {
  actionSchema,
  categorySchema,
  DB,
  ItemType,
  tagSchema,
  walletSchema,
} from './helpers/DBHelpers';
import {
  getCategoryById,
  getCategoryName,
  getWalletName,
  handleErrorWithNotifications,
  loadScript,
} from './helpers/general';
import {
  getLsDB as LSGetLsDB,
  getTokenInfo as LSGetTokenInfo,
  LSDB,
  setLsDB as LSSetLsDB,
  setTokenInfo as LSSetTokenInfo,
} from './helpers/localStorage';
import {
  getFormattedLocalDate,
  getFormattedLocalDatetime,
} from './helpers/time';
import ItemView from './components/ItemView';

function redirectToCleanHomePage() {
  window.location.href = window.location.pathname;
}

const queryClient = new QueryClient();

export default function App() {
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action:
      | 'add'
      | 'show'
      | 'showCategories'
      | 'showTags'
      | 'showWallets'
      | 'manageDB';
    actionType: ItemType;
  }>();
  const [tokenInfo, setTokenInfo] = useState(LSGetTokenInfo());
  const [lsDb, setLsDb] = useState(LSGetLsDB());

  const syncTokenInfo = (newTokenInfo?: TokenInfo) => {
    setTokenInfo(newTokenInfo);
    LSSetTokenInfo(newTokenInfo);
  };

  // TODO: probably this can be done with react-query persistent stuff
  const syncLsDB = (lsDb?: LSDB) => {
    setLsDb(lsDb);
    LSSetLsDB(lsDb);
  };

  const { isLoading: mutateLoading, mutate } = useMutation({
    onError: handleErrorWithNotifications,
    onSuccess: (lsDb, attrs) => {
      syncLsDB(lsDb);
      attrs?.alertMsg &&
        toast(attrs.alertMsg, { type: 'success', autoClose: 1000 });
    },
    mutationFn: async (attrs: {
      tokenInfo: typeof tokenInfo;
      lsDb: typeof lsDb;
      alertMsg?: string;
      fn: (attrs: { tokenInfo: TokenInfo; gdFileId: string }) => Promise<DB>;
    }) => {
      if (!attrs.tokenInfo) throw new Error('MISSING_TOKEN_INFO');
      if (!attrs.lsDb) throw new Error('MISSING_DB_DATA');

      const db = await attrs.fn({
        tokenInfo: attrs.tokenInfo,
        gdFileId: attrs.lsDb.fileId,
      });

      return { ...attrs.lsDb, db };
    },
  });

  const handleAddActionFormSubmit = async (data: unknown) => {
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Entrada agregada',
      fn: async ({ tokenInfo, gdFileId }) => {
        const db = await addItem(tokenInfo, {
          gdFileId,
          data,
          type: 'actions',
          schema: actionSchema,
        });

        setValue(undefined);
        setPopup(undefined);

        return db;
      },
    });
  };

  const handleEditActionSubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Entrada editada',
      fn: ({ tokenInfo, gdFileId }) =>
        editItem(tokenInfo, {
          gdFileId,
          data,
          type: 'actions',
          schema: actionSchema,
        }),
    });

  const handleActionDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Entrada eliminada',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteItem(tokenInfo, { gdFileId, id, type: 'actions' }),
    });

  const handleAddCategorySubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría agregada',
      fn: ({ tokenInfo, gdFileId }) =>
        addItem(tokenInfo, {
          gdFileId,
          data,
          type: 'categories',
          schema: categorySchema,
        }),
    });

  const handleEditCategorySubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría editada',
      fn: ({ tokenInfo, gdFileId }) =>
        editItem(tokenInfo, {
          gdFileId,
          data,
          type: 'categories',
          schema: categorySchema,
        }),
    });

  const handleCategoryDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría eliminada',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteItem(tokenInfo, { gdFileId, id, type: 'categories' }),
    });

  const handleAddTagSubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Etiqueta agregada',
      fn: ({ tokenInfo, gdFileId }) =>
        addItem(tokenInfo, { gdFileId, data, type: 'tags', schema: tagSchema }),
    });

  const handleEditTagSubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Etiqueta editada',
      fn: ({ tokenInfo, gdFileId }) =>
        editItem(tokenInfo, {
          gdFileId,
          data,
          type: 'tags',
          schema: tagSchema,
        }),
    });

  const handleTagDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Etiqueta eliminada',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteItem(tokenInfo, { gdFileId, id, type: 'tags' }),
    });

  const handleAddWalletSubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Bolsillo agregado',
      fn: ({ tokenInfo, gdFileId }) =>
        addItem(tokenInfo, {
          gdFileId,
          data,
          type: 'wallets',
          schema: walletSchema,
        }),
    });

  const handleEditWalletSubmit = (data: unknown) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Bolsillo editado',
      fn: ({ tokenInfo, gdFileId }) =>
        editItem(tokenInfo, {
          gdFileId,
          data,
          type: 'wallets',
          schema: walletSchema,
        }),
    });

  const handleWalletDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Bolsillo eliminado',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteItem(tokenInfo, {
          gdFileId,
          id,
          type: 'wallets',
        }),
    });

  const handleActionClick = (actionType: ItemType) => {
    if (!value) return;
    setPopup({ action: 'add', actionType });
  };

  const [client, setClient] = useState<google.accounts.oauth2.CodeClient>();

  useEffect(() => {
    (async () => {
      try {
        if (tokenInfo) return;

        // no session, try to get token info from search params
        const sp = new URLSearchParams(window.location.search);
        const newTokenInfoRes = TokenInfoSchema.safeParse({
          rt: sp.get('rt'),
          cs: sp.get('cs'),
          cid: GOOGLE_CLIENT_ID,
        });

        if (newTokenInfoRes.success) {
          const newTokenInfo = newTokenInfoRes.data;
          syncTokenInfo(newTokenInfo);
          syncLsDB();
          redirectToCleanHomePage();
          return;
        }

        // no session, load the sign in button
        void (await loadScript('gsiClient', GOOGLE_SERVICE_IDENTITY_CLIENT));

        const client = google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'redirect',
          redirect_uri: GOOGLE_REDIRECT_SERVER_URL,
          scope: GOOGLE_SCOPE,
          state: JSON.stringify({
            redirectFrontendUri: window.location.href,
            redirectUri: GOOGLE_REDIRECT_SERVER_URL,
          }),
        });

        setClient(client);
      } catch (err: any) {
        console.log(err?.stack);
        toast(err?.message || 'Error.', { type: 'error', autoClose: false });
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col direct-first-child:mt-auto overflow-auto fixed inset-0">
        <div className="overflow-auto px-4 py-4 flex-grow">
          {lsDb?.db.actions.slice(0, 5).map((it) => (
            <ItemView
              key={it.id}
              viewType="small"
              id={it.id}
              title={formatNumberValueToCurrency(it.value)}
              description={getCategoryName(lsDb.db.categories, it.categoryId)}
              texts={[
                `${
                  it.type === 'expense' ? 'Gasto' : 'Ingreso'
                } - ${getFormattedLocalDatetime(it.date)}`,
              ]}
            />
          ))}
        </div>
        <div className="relative before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-5 before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)] mb-4" />

        <div className="flex flex-wrap gap-2 px-1 justify-center">
          {!tokenInfo && client ? (
            <button onClick={() => client.requestCode()}>
              Iniciar sesión con Google
            </button>
          ) : null}

          {tokenInfo ? (
            <>
              <button
                onClick={async () => {
                  if (!window.confirm('Cerrar sesión?')) return;
                  syncTokenInfo();
                  syncLsDB();
                  redirectToCleanHomePage();
                }}
              >
                Cerrar sesión
              </button>

              <button
                onClick={() =>
                  setPopup({ action: 'manageDB', actionType: 'income' })
                }
              >
                Gestionar DB
              </button>
            </>
          ) : null}

          <button onClick={() => redirectToCleanHomePage()}>Recargar</button>
        </div>

        <div className="text-sm text-center text-neutral-500">
          Version: {APP_VERSION}
        </div>

        <div className="w-1/2 mx-auto mt-7 mb-2 border-b-4 border-b-[#333]" />
        <Calculator
          value={value}
          onButtonClick={setValue}
          onBackspaceLongPress={() => setValue(undefined)}
        />
        <div className="flex gap-2 p-4 pt-0 ch:grow ch:text-xl ch:basis-1/2">
          <button
            className="bg-green-700"
            onClick={handleActionClick.bind(null, 'income')}
          >
            Ingreso
          </button>
          <button
            className="bg-red-800"
            onClick={handleActionClick.bind(null, 'expense')}
          >
            Gasto
          </button>
        </div>

        <div className="h-14 bg-black/20 grid grid-cols-1 gap-px shrink-0">
          {[
            {
              label: 'Entradas',
              onClick: () =>
                setPopup({ action: 'show', actionType: 'expense' }),
            },
          ].map((it) => (
            <div
              role="button"
              key={it.label}
              onClick={it.onClick}
              className="text-xs bg-black/30 flex items-center justify-center px-2 text-center"
            >
              {it.label}
            </div>
          ))}
        </div>

        <div className="h-14 bg-black/20 grid grid-cols-6 gap-px shrink-0">
          {[
            {
              label: 'Categoría ingresos',
              onClick: () =>
                setPopup({ action: 'showCategories', actionType: 'income' }),
            },
            {
              label: 'Categoría gastos',
              onClick: () =>
                setPopup({ action: 'showCategories', actionType: 'expense' }),
            },
            {
              label: 'Bolsillo ingresos',
              onClick: () =>
                setPopup({ action: 'showWallets', actionType: 'income' }),
            },
            {
              label: 'Bolsillo gastos',
              onClick: () =>
                setPopup({ action: 'showWallets', actionType: 'expense' }),
            },
            {
              label: 'Etiqueta ingresos',
              onClick: () =>
                setPopup({ action: 'showTags', actionType: 'income' }),
            },
            {
              label: 'Etiqueta gastos',
              onClick: () =>
                setPopup({ action: 'showTags', actionType: 'expense' }),
            },
          ].map((it) => (
            <div
              role="button"
              key={it.label}
              onClick={it.onClick}
              className="text-xs bg-black/90 flex items-center justify-center px-2 text-center"
            >
              {it.label}
            </div>
          ))}
        </div>

        {lsDb && popup?.action === 'show' ? (
          <PopupIncomesExpenses
            db={lsDb.db}
            onClose={() => setPopup(undefined)}
            onItemDelete={handleActionDelete}
            onEditItemSubmit={handleEditActionSubmit}
          />
        ) : null}

        {lsDb && popup?.action === 'add' && (
          <PopupIncomeExpenseForm
            db={lsDb.db}
            value={value}
            actionType={popup.actionType}
            onSubmit={handleAddActionFormSubmit}
            onClose={() => setPopup(undefined)}
          />
        )}

        {lsDb && popup?.action === 'showCategories' ? (
          <PopupCRUD
            dbNamespace="categories"
            title="Categorías"
            items={lsDb.db.categories}
            actionType={popup.actionType}
            actions={lsDb.db.actions}
            onItemDelete={handleCategoryDelete}
            onEditItemSubmit={handleEditCategorySubmit}
            onNewItemSubmit={handleAddCategorySubmit}
            onClose={() => setPopup(undefined)}
            getItemInfo={({ item, actions }) => ({
              title: item.name,
              description: `Items: ${actions.reduce(
                (t, ac) => (ac.categoryId === item.id ? t + 1 : t),
                0
              )}`,
              texts: [
                `Prioridad de orden: ${item.sortPriority}`,
                `Bolsillo: ${getWalletName(lsDb.db.wallets, item.walletId)}`,
                item.description,
              ],
            })}
            formItemElements={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: popup.actionType,
              },
              {
                type: 'input',
                name: 'name',
                required: true,
                label: 'Nombre',
              },
              {
                type: 'inputNumber',
                name: 'sortPriority',
                required: true,
                label: 'Prioridad de orden',
              },
              {
                type: 'select',
                name: 'walletId',
                required: true,
                label: 'Bolsillo',
                options: lsDb.db.wallets
                  .filter((it) => it.type === popup.actionType)
                  .map((it) => ({ value: it.id, label: it.name })),
              },
              {
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
            ]}
          />
        ) : null}

        {lsDb && popup?.action === 'showTags' ? (
          <PopupCRUD
            dbNamespace="tags"
            title="Etiquetas"
            items={lsDb.db.tags}
            actionType={popup.actionType}
            actions={lsDb.db.actions}
            onItemDelete={handleTagDelete}
            onEditItemSubmit={handleEditTagSubmit}
            onNewItemSubmit={handleAddTagSubmit}
            onClose={() => setPopup(undefined)}
            getItemInfo={({ item, actions }) => ({
              title: item.name,
              description: `Items: ${actions.reduce(
                (t, ac) =>
                  item.categoryIds.includes(ac.categoryId) ||
                  item.walletIds.includes(
                    getCategoryById(lsDb.db.categories, ac.categoryId)
                      ?.walletId ?? ''
                  )
                    ? t + 1
                    : t,
                0
              )}`,
              texts: [
                `Prioridad de orden: ${item.sortPriority}`,
                `Esperado mensual: ${formatNumberValueToCurrency(
                  item.expectedPerMonth
                )}`,
                `Bolsillos (${item.walletIds.length}):
                  ${
                    item.walletIds
                      .map(
                        (id) => lsDb.db.wallets.find((it) => it.id === id)?.name
                      )
                      .join(', ') || '-'
                  }`,
                `Categorías (${item.categoryIds.length}):
                  ${
                    item.categoryIds
                      .map(
                        (id) =>
                          lsDb.db.categories.find((it) => it.id === id)?.name
                      )
                      .join(', ') || '-'
                  }`,
              ],
            })}
            formItemElements={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: popup.actionType,
              },
              {
                type: 'input',
                name: 'name',
                required: true,
                label: 'Nombre',
              },
              {
                type: 'inputNumber',
                name: 'sortPriority',
                required: true,
                label: 'Prioridad de orden',
              },
              {
                type: 'inputNumber',
                name: 'expectedPerMonth',
                label: 'Esperado mensual',
              },
              {
                type: 'selectMultiple',
                name: 'categoryIds',
                label: 'Categorías',
                options: lsDb.db.categories
                  .filter((it) => it.type === popup.actionType)
                  .map((it) => ({ value: it.id, label: it.name })),
              },
              {
                type: 'selectMultiple',
                name: 'walletIds',
                label: 'Bolsillos',
                options: lsDb.db.wallets
                  .filter((it) => it.type === popup.actionType)
                  .map((it) => ({ value: it.id, label: it.name })),
              },
              {
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
            ]}
          />
        ) : null}

        {lsDb && popup?.action === 'showWallets' ? (
          <PopupCRUD
            dbNamespace="wallets"
            title="Bolsillos"
            items={lsDb.db.wallets}
            actionType={popup.actionType}
            actions={lsDb.db.actions}
            onItemDelete={handleWalletDelete}
            onEditItemSubmit={handleEditWalletSubmit}
            onNewItemSubmit={handleAddWalletSubmit}
            onClose={() => setPopup(undefined)}
            getItemInfo={({ item, actions }) => ({
              title: item.name,
              description: `Items: ${actions.reduce(
                (t, it) =>
                  getCategoryById(lsDb.db.categories, it.categoryId)
                    ?.walletId === item.id
                    ? t + 1
                    : t,
                0
              )}`,
              texts: [
                `Prioridad de orden: ${item.sortPriority}`,
                `Categorías: ${lsDb.db.categories.reduce(
                  (t, it) => (it.walletId === item.id ? t + 1 : t),
                  0
                )}`,
                `Esperado mensual: ${formatNumberValueToCurrency(
                  item.expectedPerMonth
                )}`,
                item.description,
              ],
            })}
            formItemElements={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: popup.actionType,
              },
              {
                type: 'input',
                name: 'name',
                required: true,
                label: 'Nombre',
              },
              {
                type: 'inputNumber',
                name: 'sortPriority',
                required: true,
                label: 'Prioridad de orden',
              },
              {
                type: 'inputNumber',
                name: 'expectedPerMonth',
                label: 'Esperado mensual',
              },
              {
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
            ]}
          />
        ) : null}

        {tokenInfo && popup?.action === 'manageDB' ? (
          <PopupManageDB
            dbPath={lsDb?.path ?? ''}
            tokenInfo={tokenInfo}
            onDBSync={syncLsDB}
            onClose={() => setPopup(undefined)}
          />
        ) : null}

        {mutateLoading && <Loading />}
        <ToastContainer transition={Slide} position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
