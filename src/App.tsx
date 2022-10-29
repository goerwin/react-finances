import { useEffect, useState } from 'react';
import {
  addAction,
  deleteAction,
  editAction,
  getDB,
  updateDB,
} from './api/actions';
import Calculator from './components/Calculator';
import Loading from './components/Loading';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import { GAPI_API_KEY } from './config';
import { Action, ActionType, DB, initialDB } from './helpers/DBValidator';
import { loadGapiClient, loadGISClient } from './helpers/GoogleApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<
    | { action: 'add'; actionType: ActionType }
    | { action: 'show'; actionType: ActionType }
  >();
  const [gapi, setGapi] = useState<typeof globalThis.gapi>();
  const [google, setGoogle] = useState<typeof globalThis.google>();
  const [db, setDB] = useState<DB>();

  const closePopup = () => setPopup(undefined);

  const performAsyncActionWithApi = async function <T>(
    attrs: {
      gapi?: typeof globalThis.gapi;
      google?: typeof globalThis.google;
    },
    fn?: (attrs: {
      gapi: typeof globalThis.gapi;
      google: typeof globalThis.google;
    }) => Promise<T>
  ): Promise<T | undefined> {
    const { gapi, google } = attrs;

    if (!gapi || !google) return;

    setIsLoading(true);

    const fnResp = await fn?.({ gapi, google });
    setDB(await getDB({ gapi, google }));
    setIsLoading(false);

    return fnResp;
  };

  const handleAddActionFormSubmit = async (values: Action) => {
    await performAsyncActionWithApi(
      { gapi, google },
      async ({ gapi, google }) => {
        await addAction({
          gapi,
          google,
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
    await performAsyncActionWithApi(
      { gapi, google },
      async ({ gapi, google }) => {
        await deleteAction({ gapi, google, actionId });
        closePopup();
      }
    );
  };

  const handleEditActionSubmit = async (action: Action) => {
    await performAsyncActionWithApi(
      { gapi, google },
      async ({ gapi, google }) => editAction({ action, gapi, google })
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
      setGapi(gapi);
      setGoogle(google);

      await performAsyncActionWithApi({ gapi, google });
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
          Ver gastos
        </button>
        <button
          onClick={() => setPopup({ action: 'show', actionType: 'income' })}
        >
          Ver ingresos
        </button>
        <button
          onClick={async () => {
            if (!gapi || !google) return;
            if (!window.confirm('Reiniciar la base de datos?')) return;
            await updateDB({ db: initialDB, gapi, google });
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
          onActionDelete={handleActionDelete}
          onEditActionSubmit={handleEditActionSubmit}
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
