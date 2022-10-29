import { useEffect, useState } from 'react';
import {
  addAction,
  addCategory,
  deleteAction,
  deleteCategory,
  editAction,
  editCategory,
  getDB,
  updateDB,
} from './api/actions';
import Calculator from './components/Calculator';
import Loading from './components/Loading';
import PopupCategories from './components/PopupCategories';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import { GAPI_API_KEY, GAPI_CLIENT_ID, GAPI_SCOPE } from './config';
import {
  Action,
  ActionCategory,
  ActionType,
  DB,
  initialDB,
} from './helpers/DBValidator';
import {
  loadGapiClient,
  loadGISClient,
  requestGapiAccessToken,
} from './helpers/GoogleApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action: 'add' | 'show' | 'showCategories';
    actionType: ActionType;
  }>();
  const [gapi, setGapi] = useState<typeof globalThis.gapi>();
  const [google, setGoogle] = useState<typeof globalThis.google>();
  const [accessToken, setAccessToken] = useState<string>();
  const [db, setDB] = useState<DB>();

  const closePopup = () => setPopup(undefined);

  const performAsyncActionWithApi = async function <T>(
    attrs: {
      gapi?: typeof globalThis.gapi;
      google?: typeof globalThis.google;
      accessToken?: string;
    },
    fn?: (attrs: {
      gapi: typeof globalThis.gapi;
      google: typeof globalThis.google;
      accessToken: string;
    }) => Promise<T>
  ): Promise<T | undefined> {
    try {
      const { gapi, google, accessToken } = attrs;

      if (!gapi || !google || !accessToken) return;

      setIsLoading(true);

      const fnResp = await fn?.({ gapi, google, accessToken });
      setDB(await getDB({ gapi, google, accessToken }));

      return fnResp;
    } catch (err: any) {
      alert(err?.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActionFormSubmit = async (values: Action) => {
    await performAsyncActionWithApi(
      {},
      async ({ gapi, google, accessToken }) => {
        await addAction({
          gapi,
          google,
          accessToken,
          newAction: {
            incomeCategory: values.incomeCategory,
            expenseCategory: values.expenseCategory,
            type: values.type,
            description: values.description,
            value: values.value,
          },
        });

        setValue(undefined);
        closePopup();
      }
    );
  };

  const handleActionDelete = async (actionId: string) => {
    await performAsyncActionWithApi({}, async ({ gapi, google, accessToken }) =>
      deleteAction({ gapi, google, accessToken, actionId })
    );
  };

  const handleEditActionSubmit = async (action: Action) => {
    await performAsyncActionWithApi({}, async ({ gapi, google, accessToken }) =>
      editAction({ action, gapi, google, accessToken })
    );
  };

  const handleCategoryDelete = async (categoryId: string) => {
    await performAsyncActionWithApi({}, async ({ gapi, google, accessToken }) =>
      deleteCategory({ categoryId, gapi, google, accessToken })
    );
  };

  const handleAddCategorySubmit = async (
    category: ActionCategory,
    type: ActionType
  ) => {
    await performAsyncActionWithApi({}, async ({ gapi, google, accessToken }) =>
      addCategory({ category, type, gapi, google, accessToken })
    );
  };

  const handleEditCategorySubmit = async (category: ActionCategory) => {
    await performAsyncActionWithApi({}, async ({ gapi, google, accessToken }) =>
      editCategory({ category, gapi, google, accessToken })
    );
  };

  const handleCalcButtonClick = (value: string) => {
    setValue(value);
  };

  const handleActionClick = (actionType: ActionType) => {
    if (!value) return;
    setPopup({ action: 'add', actionType });
  };

  useEffect(() => {
    const loadDBGapiGISClientsD = async () => {
      const [gapi, google] = await Promise.all([
        loadGapiClient({ apiKey: GAPI_API_KEY }),
        loadGISClient(),
      ]);

      const accessToken = (
        await requestGapiAccessToken({
          gapi,
          google,
          clientId: GAPI_CLIENT_ID,
          scope: GAPI_SCOPE,
          skipConsentOnNoToken: true,
        })
      ).access_token;

      await performAsyncActionWithApi({ gapi, google, accessToken });

      setGapi(gapi);
      setGoogle(google);
      setAccessToken(accessToken);
    };

    loadDBGapiGISClientsD().catch((el) => {
      if (el.message === 'DB Bad Format') {
        console.log(el.message);
      }
    });
  }, []);

  return (
    <div>
      {isLoading && <Loading />}
      <Calculator value={value} onButtonClick={handleCalcButtonClick} />
      <div className="flex gap-2 p-4 ch:grow ch:text-xl">
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

      <div className="flex flex-wrap gap-2 justify-center p-2 ch:flex-grow ch:flex-shrink ch:basis-0">
        <button onClick={() => setValue(undefined)}>Limpiar</button>
        <button
          onClick={() => setPopup({ action: 'show', actionType: 'expense' })}
        >
          Gastos
        </button>
        <button
          onClick={() => setPopup({ action: 'show', actionType: 'income' })}
        >
          Ingresos
        </button>
        <button
          onClick={() =>
            setPopup({ action: 'showCategories', actionType: 'expense' })
          }
        >
          Categorías de gastos
        </button>
        <button
          onClick={() =>
            setPopup({ action: 'showCategories', actionType: 'income' })
          }
        >
          Categorías de ingresos
        </button>
        <button
          onClick={async () => {
            if (!gapi || !google || !accessToken) return;
            if (!window.confirm('Reiniciar la base de datos?')) return;
            await updateDB({ db: initialDB, gapi, google, accessToken });
          }}
        >
          Reiniciar DB
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
    </div>
  );
}
