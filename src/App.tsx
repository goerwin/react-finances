import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  TokenInfo,
  TokenInfoSchema,
} from './api/actions';
import Calculator from './components/Calculator';
import Loading from './components/Loading';
import PopupCategories from './components/PopupCategories';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import PopupManageDB from './components/PopupManageDB';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_SERVER_URL,
  GOOGLE_SCOPE,
  GOOGLE_SERVICE_IDENTITY_CLIENT,
} from './config';
import { Action, ActionCategory, ActionType, DB } from './helpers/DBHelpers';
import { loadScript } from './helpers/general';
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
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action: 'add' | 'show' | 'showCategories' | 'manageDB';
    actionType: ActionType;
  }>();
  const [tokenInfo, setTokenInfo] = useState(LSGetTokenInfo());
  const [lsDb, setLsDb] = useState(LSGetLsDB());

  // Perform a database operation, sync it and update it locally
  const asyncDBTask = async function (
    fn: (
      tokenInfo: TokenInfo,
      attrs: { gdFileId: string; successMsg?: string }
    ) => Promise<DB>,
    attrs?: { alertMsg?: string }
  ) {
    try {
      if (!tokenInfo) throw new Error('MISSING_TOKEN_INFO');
      if (!lsDb) throw new Error('MISSING_DB_DATA');

      setIsLoading(true);

      const db = await fn(tokenInfo, { gdFileId: lsDb.fileId });
      syncLsDB({ ...lsDb, db });

      attrs?.alertMsg &&
        toast(attrs.alertMsg, { type: 'success', autoClose: 1000 });

      return db;
    } catch (err: any) {
      toast(err?.message || 'Ocurrió un error.', {
        type: 'error',
        autoClose: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncTokenInfo = (newTokenInfo?: TokenInfo) => {
    setTokenInfo(newTokenInfo);
    LSSetTokenInfo(newTokenInfo);
  };

  const syncLsDB = (lsDb?: LSDB) => {
    setLsDb(lsDb);
    LSSetLsDB(lsDb);
  };

  const handleAddActionFormSubmit = async (values: Action) => {
    await asyncDBTask(
      async (tokenInfo, attrs) => {
        const db = await addAction(tokenInfo, {
          ...attrs,
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
      { alertMsg: 'Entrada agregada' }
    );
  };

  const handleActionDelete = (actionId: string) =>
    asyncDBTask(
      async (tokenInfo, attrs) =>
        deleteAction(tokenInfo, { ...attrs, actionId }),
      { alertMsg: 'Entrada eliminada' }
    );

  const handleEditActionSubmit = (action: Action) =>
    asyncDBTask(
      async (tokenInfo, attrs) => editAction(tokenInfo, { ...attrs, action }),
      { alertMsg: 'Entrada editada' }
    );

  const handleCategoryDelete = (categoryId: string) =>
    asyncDBTask(
      async (tokenInfo, attrs) =>
        deleteCategory(tokenInfo, { ...attrs, categoryId }),
      { alertMsg: 'Categoría eliminada' }
    );

  const handleAddCategorySubmit = (
    category: ActionCategory,
    type: ActionType
  ) =>
    asyncDBTask(
      async (tokenInfo, attrs) =>
        addCategory(tokenInfo, { ...attrs, category, type }),
      { alertMsg: 'Categoría agregada' }
    );

  const handleEditCategorySubmit = (category: ActionCategory) =>
    asyncDBTask(
      async (tokenInfo, attrs) =>
        editCategory(tokenInfo, { ...attrs, category }),
      { alertMsg: 'Categoría editada' }
    );

  const handleActionClick = (actionType: ActionType) => {
    if (!value) return;
    setPopup({ action: 'add', actionType });
  };

  const [client, setClient] = useState<google.accounts.oauth2.CodeClient>();

  useEffect(() => {
    (async () => {
      try {
        // if (tokenInfo && dbPathInfo && db) return;

        // if (tokenInfo && dbPathInfo && !db) {
        //   syncDBPathInfo();
        //   redirectToCleanHomePage();
        //   return;
        // }

        // if (tokenInfo && !dbPathInfo) {
        //   const data = await getGoogleDriveElementInfo(tokenInfo, {
        //     path: dbpath,
        //   });

        //   const newGdFileId = data?.id;
        //   if (!newGdFileId || typeof data?.id !== 'string')
        //     throw new Error('No Google Drive FileID Found');

        //   syncDBPathInfo(newGdFileId);

        //   const db = await getDB(tokenInfo, { gdFileId: newGdFileId });
        //   syncDB(db);

        //   return;
        // }

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
      } finally {
        setIsLoading(false);
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

        {isLoading && <Loading />}
        <ToastContainer transition={Slide} position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
