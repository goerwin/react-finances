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
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_DRIVE_DB_PATH,
  GOOGLE_REDIRECT_SERVER_URL,
  GOOGLE_SCOPE,
  GOOGLE_SERVICE_IDENTITY_CLIENT,
} from './config';
import { Action, ActionCategory, ActionType, DB } from './helpers/DBHelpers';
import { loadScript } from './helpers/general';
import { getGoogleDriveElementInfo } from './helpers/GoogleApi';
import {
  getGDFileId as LSGetGDFileId,
  getTokenInfo as LSGetTokenInfo,
  setGDFileId as LSSetGDFileId,
  setTokenInfo as LSSetTokenInfo,
  setDB as LSSetDB,
  getDB as LSGetDB,
} from './helpers/localStorage';

function redirectToCleanHomePage() {
  window.location.href = window.location.pathname;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action: 'add' | 'show' | 'showCategories';
    actionType: ActionType;
  }>();
  const [gdFileId, setGDFileId] = useState(LSGetGDFileId());
  const [tokenInfo, setTokenInfo] = useState(LSGetTokenInfo());
  const [db, setDB] = useState<DB | undefined>(LSGetDB());

  // Perform a database operation, sync it and update it locally
  const asyncDBTask = async function (
    fn: (
      tokenInfo: TokenInfo,
      attrs: { gdFileId: string; successMsg?: string }
    ) => Promise<DB>,
    attrs?: { alertMsg?: string }
  ) {
    try {
      if (!tokenInfo) throw new Error('Missing tokenInfo');
      if (!gdFileId) throw new Error('Missing Google Drive FileId');

      setIsLoading(true);

      const db = await fn(tokenInfo, { gdFileId });
      syncDB(db);

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

  const syncDB = (newDB?: DB) => {
    setDB(newDB);
    LSSetDB(newDB);
  };

  const syncGdFileId = (newGdFileId?: string) => {
    setGDFileId(newGdFileId);
    LSSetGDFileId(newGdFileId);
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
        if (tokenInfo && gdFileId && db) return;

        if (tokenInfo && gdFileId && !db) {
          syncGdFileId();
          redirectToCleanHomePage();
          return;
        }

        if (tokenInfo && !gdFileId) {
          const data = await getGoogleDriveElementInfo(tokenInfo, {
            path: GOOGLE_DRIVE_DB_PATH,
          });

          const newGdFileId = data?.id;
          if (!newGdFileId || typeof data?.id !== 'string')
            throw new Error('No Google Drive FileID Found');

          syncGdFileId(newGdFileId);

          const db = await getDB(tokenInfo, { gdFileId: newGdFileId });
          syncDB(db);

          return;
        }

        // no session, try to get info from search params
        const sp = new URLSearchParams(window.location.search);
        const newTokenInfoRes = TokenInfoSchema.safeParse({
          rt: sp.get('rt'),
          cs: sp.get('cs'),
          cid: GOOGLE_CLIENT_ID,
        });

        if (newTokenInfoRes.success) {
          const newTokenInfo = newTokenInfoRes.data;
          syncTokenInfo(newTokenInfo);
          syncGdFileId();
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
    <div
      className="h-screen flex flex-col direct-first-child:mt-auto overflow-auto"
      style={{ height: window.innerHeight }}
    >
      <div className="text-sm text-center text-neutral-500">
        Version: {APP_VERSION}
      </div>
      {client ? (
        <button
          className="block mx-auto mt-5 mb-2"
          onClick={() => client.requestCode()}
        >
          Iniciar sesión con Google
        </button>
      ) : (
        <button
          className="block mx-auto mt-5 mb-2"
          onClick={async () => {
            if (!window.confirm('Cerrar sesión?')) return;

            syncTokenInfo();
            syncGdFileId();
            syncDB();
            redirectToCleanHomePage();
          }}
        >
          Cerrar sesión
        </button>
      )}

      <button
        className="block mx-auto"
        onClick={() => redirectToCleanHomePage()}
      >
        Recargar
      </button>

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
            onClick: () => setPopup({ action: 'show', actionType: 'expense' }),
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

      {db && popup?.action === 'show' && (
        <PopupIncomesExpenses
          db={db}
          actionType={popup.actionType}
          onClose={() => setPopup(undefined)}
          onItemDelete={handleActionDelete}
          onEditItemSubmit={handleEditActionSubmit}
        />
      )}

      {db && popup?.action === 'showCategories' && (
        <PopupCategories
          db={db}
          actionType={popup.actionType}
          onClose={() => setPopup(undefined)}
          onItemDelete={handleCategoryDelete}
          onEditItemSubmit={handleEditCategorySubmit}
          onNewItemSubmit={handleAddCategorySubmit}
        />
      )}

      {db && popup?.action === 'add' && (
        <PopupIncomeExpenseForm
          db={db}
          value={value}
          actionType={popup.actionType}
          onSubmit={handleAddActionFormSubmit}
          onClose={() => setPopup(undefined)}
        />
      )}

      {isLoading && <Loading />}
      <ToastContainer transition={Slide} position="top-center" />
    </div>
  );
}
