import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addAction, getDB, NewAction, updateDB } from './api/actions';
import './App.scss';
import Calculator, {
  removeCurrencyFormattingToValue,
} from './components/Calculator';
import { GAPI_API_KEY } from './config';
import { ActionType, DB, initialDB } from './helpers/DBValidator';
import { loadGapiClient, loadGISClient } from './helpers/GoogleApi';

function App() {
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{ actionType: ActionType }>();
  const [gapi, setGapi] = useState<typeof globalThis.gapi>();
  const [google, setGoogle] = useState<typeof globalThis.google>();
  const [db, setDB] = useState<DB>();

  const { handleSubmit, reset, register } = useForm<{
    value: string;
    type: ActionType;
    expenseCategory?: string;
    incomeCategory?: string;
    description: string;
  }>({
    defaultValues: {
      expenseCategory: undefined,
      incomeCategory: undefined,
      description: '',
    },
  });

  const closePopup = () => setPopup(undefined);

  const handleFormSubmit = async (values: any) => {
    if (!gapi || !google) return;

    const newAction: NewAction = {
      incomeCategory: values.incomeCategory,
      expenseCategory: values.expenseCategory,
      type: values.type,
      description: values.description,
      value: Number(removeCurrencyFormattingToValue(values.value)),
    };

    const resp = await addAction({ gapi, google, newAction });

    console.log(values, resp);

    setValue(undefined);
    closePopup();
    // db.actions.push({
    //   id: (db.actions.at(-1)?.id ?? 0) + 1,
    //   ...values,
    //   value: Number(removeCurrencyFormattingToValue(values.value)),
    //   date: new Date().toISOString(),
    // });

    return;
  };

  const handleButtonClick = (value: string) => {
    setValue(value);
  };

  const handleActionClick = (actionType: ActionType) => {
    if (!value) return;

    reset();
    setPopup({ actionType });
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
    };

    loadDBGapiGISClientsD().catch((el) => {
      if (el.message === 'DB Bad Format') {
        console.log(el.message);
      }
    });
  }, []);

  if (!gapi || !google) {
    return <h1>loading...</h1>;
  }

  return (
    <div>
      <Calculator value={value} onButtonClick={handleButtonClick} />
      <button onClick={handleActionClick.bind(null, 'income')}>Ingreso</button>
      <button onClick={handleActionClick.bind(null, 'expense')}>Gasto</button>
      <button
        onClick={async () => {
          const resp = window.confirm('Seguro de reiniciar la base de datos?');
          if (!resp) return;
          await updateDB({ db: initialDB, gapi, google });
        }}
      >
        Reiniciar DB
      </button>
      <button onClick={() => setValue(undefined)}>Reset</button>
      <button onClick={() => setValue(undefined)}>Ver gastos</button>
      <button onClick={() => setValue(undefined)}>Ver ingresos</button>

      {!!popup && (
        <div className="popup">
          <h2>
            {popup.actionType}: {value}
          </h2>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <input type="hidden" {...register('value', { value })} />
            <input
              type="hidden"
              {...register('type', { value: popup.actionType })}
            />

            <div className="tagContainer">
              {db?.[
                popup.actionType === 'income'
                  ? 'incomeCategories'
                  : 'expenseCategories'
              ].map(({ id, name }) => (
                <label key={id}>
                  <input
                    type="radio"
                    value={`${id}`}
                    {...register(
                      popup.actionType === 'income'
                        ? 'incomeCategory'
                        : 'expenseCategory'
                    )}
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
            <div>
              <input
                type="text"
                placeholder="Descripción"
                {...register('description')}
              />
            </div>
            <div>
              <button type="button" onClick={closePopup}>
                Cancelar
              </button>
              <button type="submit">Aceptar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
