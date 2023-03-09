import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  addAction,
  addCategory,
  addTag,
  addWallet,
  deleteAction,
  deleteCategory,
  deleteItem,
  deleteTag,
  deleteWallet,
  editAction,
  editCategory,
  editTag,
  editWallet,
  TokenInfo,
  TokenInfoSchema,
} from './api/actions';
import Calculator from './components/Calculator';
import ItemView from './components/ItemView';
import Loading from './components/Loading';
import PopupCategories from './components/PopupCategories';
import PopupCRUD from './components/PopupCRUD';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import PopupManageDB from './components/PopupManageDB';
import PopupTags from './components/PopupTags';
import PopupWallets from './components/PopupWallets';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_SERVER_URL,
  GOOGLE_SCOPE,
  GOOGLE_SERVICE_IDENTITY_CLIENT,
} from './config';
import {
  Action,
  Category,
  ItemType,
  DB,
  Tag,
  Wallet,
  categorySchema,
} from './helpers/DBHelpers';
import { handleErrorWithNotifications, loadScript } from './helpers/general';
import {
  getLsDB as LSGetLsDB,
  getTokenInfo as LSGetTokenInfo,
  LSDB,
  setLsDB as LSSetLsDB,
  setTokenInfo as LSSetTokenInfo,
} from './helpers/localStorage';

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

  const handleAddActionFormSubmit = async (newAction: Action) => {
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Entrada agregada',
      fn: async ({ tokenInfo, gdFileId }) => {
        const db = await addAction(tokenInfo, { gdFileId, newAction });

        setValue(undefined);
        setPopup(undefined);

        return db;
      },
    });
  };

  const handleActionDelete = (actionId: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Entrada eliminada',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteAction(tokenInfo, { gdFileId, actionId }),
    });

  const handleEditActionSubmit = (action: Action) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Entrada editada',
      fn: ({ tokenInfo, gdFileId }) =>
        editAction(tokenInfo, { gdFileId, action }),
    });

  const handleAddCategorySubmit = (data: Category) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría agregada',
      fn: ({ tokenInfo, gdFileId }) =>
        addCategory(tokenInfo, { gdFileId, data }),
    });

  const handleEditCategorySubmit = (data: Category) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría editada',
      fn: ({ tokenInfo, gdFileId }) =>
        editCategory(tokenInfo, { gdFileId, data }),
    });

  const handleCategoryDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría eliminada',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteItem(tokenInfo, { gdFileId, id, type: 'categories' }),
      // deleteCategory(tokenInfo, { gdFileId, id }),
    });

  const handleAddTagSubmit = (tag: Tag, type: ItemType) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Etiqueta agregada',
      fn: ({ tokenInfo, gdFileId }) =>
        addTag(tokenInfo, { gdFileId, data: tag, type }),
    });

  const handleEditTagSubmit = (data: Tag) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Etiqueta editada',
      fn: ({ tokenInfo, gdFileId }) => editTag(tokenInfo, { gdFileId, data }),
    });

  const handleWalletDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Bolsillo eliminado',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteWallet(tokenInfo, { gdFileId, id }),
    });

  const handleAddWalletSubmit = (data: Wallet, type: ItemType) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Bolsillo agregado',
      fn: ({ tokenInfo, gdFileId }) =>
        addWallet(tokenInfo, { gdFileId, data, type }),
    });

  const handleEditWalletSubmit = (data: Wallet) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Bolsillo editado',
      fn: ({ tokenInfo, gdFileId }) =>
        editWallet(tokenInfo, { gdFileId, data }),
    });

  const handleTagDelete = (id: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría eliminada',
      fn: ({ tokenInfo, gdFileId }) => deleteTag(tokenInfo, { gdFileId, id }),
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
        <div className="text-sm text-center text-neutral-500">
          Version: {APP_VERSION}
        </div>
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
              label: 'Etiqueta ingresos',
              onClick: () =>
                setPopup({ action: 'showTags', actionType: 'income' }),
            },
            {
              label: 'Etiqueta gastos',
              onClick: () =>
                setPopup({ action: 'showTags', actionType: 'expense' }),
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

        {lsDb && popup?.action === 'showCategories' ? (
          <PopupCRUD
            dbNamespace="categories"
            title="Categorías"
            actionType={popup.actionType}
            actions={lsDb.db.actions}
            items={lsDb.db.categories}
            onItemDelete={handleCategoryDelete}
            onEditItemSubmit={handleEditCategorySubmit}
            onNewItemSubmit={handleAddCategorySubmit}
            onClose={() => setPopup(undefined)}
            itemZodSchema={categorySchema}
            getItemView={({ item, actions, onRemoveClick, onEditClick }) => (
              <ItemView
                id={item.id}
                title={item.name}
                description={`Items: ${actions.reduce(
                  (t, ac) => (ac.categoryId === item.id ? t + 1 : t),
                  0
                )}`}
                texts={[
                  `Prioridad de orden: ${item.sortPriority}`,
                  item.description,
                ]}
                onRemoveClick={onRemoveClick}
                onEditClick={onEditClick}
              />
            )}
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
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
            ]}
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

        {lsDb && popup?.action === 'showTags' ? (
          <PopupTags
            db={lsDb.db}
            actionType={popup.actionType}
            onClose={() => setPopup(undefined)}
            onItemDelete={handleTagDelete}
            onEditItemSubmit={handleEditTagSubmit}
            onNewItemSubmit={handleAddTagSubmit}
          />
        ) : null}

        {lsDb && popup?.action === 'showWallets' ? (
          <PopupWallets
            db={lsDb.db}
            actionType={popup.actionType}
            onClose={() => setPopup(undefined)}
            onItemDelete={handleWalletDelete}
            onEditItemSubmit={handleEditWalletSubmit}
            onNewItemSubmit={handleAddWalletSubmit}
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
