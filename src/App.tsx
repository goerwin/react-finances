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
  getDB,
  TokenInfo,
  TokenInfoSchema,
  updateDB,
} from './api/actions';
import Calculator from './components/Calculator';
import Loading from './components/Loading';
import PopupCategories from './components/PopupCategories';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import {
  // GAPI_API_KEY,
  GAPI_CLIENT_ID,
  GAPI_DB_PATH,
  GAPI_SCOPE,
} from './config';
import {
  Action,
  ActionCategory,
  ActionType,
  DB,
  initialDB,
} from './helpers/DBHelpers';
import { loadScript } from './helpers/general';
import {
  getGoogleDriveElementInfo,
  getNewAccessToken,
  loadGapiClient,
  loadGISClient,
  requestGapiAccessToken,
} from './helpers/GoogleApi';
import {
  getGDFileId as LSGetGDFileId,
  setGDFileId as LSSetGDFileId,
  setTokenInfo as LSSetTokenInfo,
  getTokenInfo as LSGetTokenInfo,
} from './helpers/localStorage';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action: 'add' | 'show' | 'showCategories';
    actionType: ActionType;
  }>();
  const [accessToken, setAccessToken] = useState<string>();
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
          const {
            at: accessToken,
            rt: refreshToken,
            cs: clientSecret,
          } = tokenInfo;
          let newGdFileId = gdFileId;

          // Get the gdFileId if not already saved in LocalStorage
          if (!newGdFileId) {
            const dbElInfo = await getGoogleDriveElementInfo(
              { at: accessToken, rt: refreshToken, cs: clientSecret },
              { path: GAPI_DB_PATH }
            );

            if (!newGdFileId || typeof dbElInfo.data?.id !== 'string')
              throw new Error('No Google Drive FileID Found');
          }

          const db = await getDB(tokenInfo, { gdFileId: newGdFileId });

          LSSetGDFileId(newGdFileId);
          setGDFileId(newGdFileId);
          setDB(db);

          return;
        }

        const sp = new URLSearchParams(window.location.search);
        const newTokenInfo = TokenInfoSchema.safeParse({
          rt: sp.get('rt'),
          at: sp.get('at'),
          cs: sp.get('cs'),
        });

        if (newTokenInfo.success) {
          setTokenInfo(newTokenInfo.data);
          LSSetTokenInfo(newTokenInfo.data);
          window.location.href = '/';
          return;
        }

        await loadScript('gsiClient', 'https://accounts.google.com/gsi/client');

        const client = google.accounts.oauth2.initCodeClient({
          client_id: GAPI_CLIENT_ID,
          ux_mode: 'redirect',
          redirect_uri: 'http://localhost:3000/oauth2callback/google',
          scope: GAPI_SCOPE,
          state: window.location.href,
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
    <div>
      {client ? (
        <button
          className="block mx-auto mt-5"
          onClick={() => client.requestCode()}
        >
          Login with Google
        </button>
      ) : null}

      {isLoading && <Loading />}
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

      <div className="flex flex-wrap gap-2 justify-center px-2 ch:flex-grow ch:basis-0">
        <div className="flex gap-4 !basis-full ch:basis-1/2">
          <button
            className="btn-success bg-opacity-50"
            onClick={() => setPopup({ action: 'show', actionType: 'income' })}
          >
            Ingresos
          </button>
          <button
            className="btn-danger bg-opacity-50"
            onClick={() => setPopup({ action: 'show', actionType: 'expense' })}
          >
            Gastos
          </button>
        </div>

        <button
          onClick={() =>
            setPopup({ action: 'showCategories', actionType: 'income' })
          }
        >
          Categorías ingresos
        </button>
        <button
          onClick={() =>
            setPopup({ action: 'showCategories', actionType: 'expense' })
          }
        >
          Categorías gastos
        </button>
        <button
          onClick={async () => {
            if (!window.confirm('Logout?')) return;

            LSSetTokenInfo(undefined);
            setTokenInfo(undefined);
            window.location.href = '/';
          }}
        >
          Logout
        </button>
        <button onClick={() => window.location.reload()}>Recargar</button>
      </div>

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
      <ToastContainer />
    </div>
  );
}
