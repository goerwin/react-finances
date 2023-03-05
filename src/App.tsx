import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  addAction,
  addCategory,
  deleteAction,
  deleteCategory,
  editAction,
  editCategory,
  getDB,
  TokenInfo,
  TokenInfoSchema,
} from './api/actions';
import Calculator from './components/Calculator';
import Loading from './components/Loading';
import PopupCategories from './components/PopupCategories';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import PopupManageDB from './components/PopupManageDB';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_SERVER_URL,
  GOOGLE_SCOPE,
  GOOGLE_SERVICE_IDENTITY_CLIENT,
} from './config';
import { Action, ActionCategory, ActionType, DB } from './helpers/DBHelpers';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 2, // 2 hours
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export default function App() {
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action: 'add' | 'show' | 'showCategories' | 'manageDB';
    actionType: ActionType;
  }>();
  const [tokenInfo, setTokenInfo] = useState(LSGetTokenInfo());
  const [lsDb, setLsDb] = useState(LSGetLsDB());

  const { data, isLoading, status } = useQuery(
    ['db'],
    async () => {
      return getDB(tokenInfo!, { gdFileId: lsDb?.fileId! });
    },
    {
      enabled: !!tokenInfo && !!lsDb,
    }
  );

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

  const handleAddActionFormSubmit = async (values: Action) => {
    mutate(
      {
        tokenInfo,
        lsDb,
        alertMsg: 'Entrada agregada',
        fn: async ({ tokenInfo, gdFileId }) => {
          const db = await addAction(tokenInfo, {
            gdFileId,
            newAction: {
              incomeCategory: values.incomeCategory,
              expenseCategory: values.expenseCategory,
              type: values.type,
              description: values.description,
              value: values.value,
            },
          });

          setValue(undefined);
          setPopup(undefined);

          return db;
        },
      },
      {
        onSuccess: (_, attrs) => {
          attrs?.alertMsg &&
            toast(attrs.alertMsg, { type: 'success', autoClose: 1000 });
        },
      }
    );
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

  const handleCategoryDelete = (categoryId: string) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría eliminada',
      fn: ({ tokenInfo, gdFileId }) =>
        deleteCategory(tokenInfo, { gdFileId, categoryId }),
    });

  const handleAddCategorySubmit = (
    category: ActionCategory,
    type: ActionType
  ) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría agregada',
      fn: ({ tokenInfo, gdFileId }) =>
        addCategory(tokenInfo, { gdFileId, category, type }),
    });

  const handleEditCategorySubmit = (category: ActionCategory) =>
    mutate({
      tokenInfo,
      lsDb,
      alertMsg: 'Categoría editada',
      fn: ({ tokenInfo, gdFileId }) =>
        editCategory(tokenInfo, { gdFileId, category }),
    });

  const handleActionClick = (actionType: ActionType) => {
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
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
        <div className="h-14 bg-black/20 grid grid-cols-4 gap-px shrink-0">
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
              label: 'Ingresos',
              onClick: () => setPopup({ action: 'show', actionType: 'income' }),
            },
            {
              label: 'Gastos',
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
        <div className="h-14 bg-black/80 shrink-0" />

        {lsDb && popup?.action === 'show' && (
          <PopupIncomesExpenses
            db={lsDb.db}
            actionType={popup.actionType}
            onClose={() => setPopup(undefined)}
            onItemDelete={handleActionDelete}
            onEditItemSubmit={handleEditActionSubmit}
          />
        )}

        {lsDb && popup?.action === 'showCategories' && (
          <PopupCategories
            db={lsDb.db}
            actionType={popup.actionType}
            onClose={() => setPopup(undefined)}
            onItemDelete={handleCategoryDelete}
            onEditItemSubmit={handleEditCategorySubmit}
            onNewItemSubmit={handleAddCategorySubmit}
          />
        )}

        {lsDb && popup?.action === 'add' && (
          <PopupIncomeExpenseForm
            db={lsDb.db}
            value={value}
            actionType={popup.actionType}
            onSubmit={handleAddActionFormSubmit}
            onClose={() => setPopup(undefined)}
          />
        )}

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
    </PersistQueryClientProvider>
  );
}
