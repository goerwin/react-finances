import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  addAction,
  addCategory,
  deleteAction,
  deleteCategory,
  editAction,
  editCategory,
  getDBWithAccessToken,
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
  const [db, setDB] = useState<DB>();

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
      setDB(db);

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
        if (tokenInfo) {
          const { at, rt, cs } = tokenInfo;
          let newGdFileId = gdFileId;

          // Get the gdFileId if not already saved in LocalStorage
          if (!newGdFileId) {
            const dbElInfo = await getGoogleDriveElementInfo(
              { at, rt, cs },
              { path: GOOGLE_DRIVE_DB_PATH }
            );

            newGdFileId = dbElInfo.data?.id;

            if (!newGdFileId || typeof dbElInfo.data?.id !== 'string')
              throw new Error('No Google Drive FileID Found');
          }

          const { db, accessToken } = await getDBWithAccessToken(tokenInfo, {
            gdFileId: newGdFileId,
          });

          // if accessToken return that means it was updated
          if (accessToken) {
            const newTokenInfo = { ...tokenInfo, at: accessToken };
            LSSetTokenInfo(newTokenInfo);
            setTokenInfo(newTokenInfo);
          }

          LSSetGDFileId(newGdFileId);
          setGDFileId(newGdFileId);
          setDB(db);

          return;
        }

        const sp = new URLSearchParams(window.location.search);
        const newTokenInfoRes = TokenInfoSchema.safeParse({
          rt: sp.get('rt'),
          at: sp.get('at'),
          cs: sp.get('cs'),
        });

        if (newTokenInfoRes.success) {
          setTokenInfo(newTokenInfoRes.data);
          LSSetTokenInfo(newTokenInfoRes.data);
          redirectToCleanHomePage();
          return;
        }

        await loadScript('gsiClient', GOOGLE_SERVICE_IDENTITY_CLIENT);

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

            LSSetTokenInfo(undefined);
            setTokenInfo(undefined);
            LSSetGDFileId(undefined);
            setGDFileId(undefined);
            redirectToCleanHomePage();
          }}
        >
          Cerrar sesión
        </button>
      )}

      <button
        className="block mx-auto"
        onClick={() => window.location.reload()}
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
      <ToastContainer />
    </div>
  );
}
