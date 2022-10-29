import { useEffect, useState } from 'react';
import {
  addAction,
  deleteAction,
  getDB,
  NewAction,
  updateDB,
} from './api/actions';
import Calculator, {
  removeCurrencyFormattingToValue,
} from './components/Calculator';
import Loading from './components/Loading';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import { GAPI_API_KEY } from './config';
import { ActionType, DB, initialDB } from './helpers/DBValidator';
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

  const handleFormSubmit = async (values: any) => {
    if (!gapi || !google) return;

    setIsLoading(true);

    const newAction: NewAction = {
      incomeCategory: values.incomeCategory,
      expenseCategory: values.expenseCategory,
      type: values.type,
      description: values.description,
      value: Number(removeCurrencyFormattingToValue(values.value)),
    };

    await addAction({ gapi, google, newAction });

    setValue(undefined);
    setDB(await getDB({ gapi, google }));
    closePopup();
    setIsLoading(false);
  };

  const handleActionDelete = async (actionId: string) => {
    if (!gapi || !google) return;

    setIsLoading(true);

    await deleteAction({ gapi, google, actionId });

    setValue(undefined);
    setDB(await getDB({ gapi, google }));
    closePopup();
    setIsLoading(false);
  };

  const handleButtonClick = (value: string) => {
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

      const db = await getDB({ gapi, google });
      setDB(db);
      setIsLoading(false);
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
      <Calculator value={value} onButtonClick={handleButtonClick} />
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
        />
      )}

      {db && popup?.action === 'add' && (
        <PopupIncomeExpenseForm
          db={db}
          value={value}
          actionType={popup.actionType}
          onSubmit={handleFormSubmit}
          onClose={() => setPopup(undefined)}
        />
      )}
    </div>
  );
}
