import Calculator from './components/Calculator';
import { initGapi } from './components/GoogleApi';
import './App.scss';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const db = {
  updatedAt: "'2022-10-21T01:45:37.919Z'",
  expenseCategories: [
    { id: 32, name: 'comida' },
    { id: 42, name: 'servicio público' },
    {
      id: 10,
      name: 'servicio público agua',
      description: 'Pago servicio del agua',
    },
  ],
  incomeCategories: [
    { id: 1, name: 'Salario' },
    { id: 2, name: 'Préstamo' },
  ],
  actions: [
    //     {
    //       // TODO:
    // // $3,000,000	2022/10/01
    //     },
    {
      date: '2022-10-21T01:45:37.919Z',
      type: 'expense | income',
      expenseCategories: [1, 2],
      incomeCategories: [],
      description: 'Optional',
    },
  ],
};

type ActionType = 'expense' | 'income';

function App() {
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{ actionType: ActionType }>();
  const { handleSubmit, reset, register } = useForm<{
    value: string;
    type: ActionType;
    expenseCategories: any[];
    incomeCategories: any[];
    description: string;
  }>({
    defaultValues: {
      expenseCategories: [],
      incomeCategories: [],
      description: '',
    },
  });

  const closePopup = () => setPopup(undefined);

  const onSubmit = (values: any) => {
    console.log({ ...values, date: new Date().toISOString() });
    setValue(undefined);
    closePopup();
  };

  const handleButtonClick = (value: string) => {
    setValue(value);
  };

  const handleActionClick = (actionType: ActionType) => {
    reset();
    setPopup({ actionType });
  };

  return (
    <div>
      <Calculator value={value} onButtonClick={handleButtonClick} />
      <button onClick={handleActionClick.bind(null, 'income')}>Ingreso</button>
      <button onClick={handleActionClick.bind(null, 'expense')}>Gasto</button>
      <button onClick={() => initGapi()}>Load Google Api</button>

      {!!popup && (
        <div className="popup">
          <h2>
            {popup.actionType}: {value}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('value', { value })} />
            <input
              type="hidden"
              {...register('type', { value: popup.actionType })}
            />

            <div className="tagContainer">
              {db[
                popup.actionType === 'income'
                  ? 'incomeCategories'
                  : 'expenseCategories'
              ].map(({ id, name }) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    value={`${id}`}
                    {...register(
                      popup.actionType === 'income'
                        ? 'incomeCategories'
                        : 'expenseCategories'
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
