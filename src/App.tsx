import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  type TokenInfo,
  TokenInfoSchema,
} from './api/actions';
import Button from './components/Button';
import Calculator, {
  formatNumberValueToCurrency,
} from './components/Calculator';
import ItemView from './components/ItemView';
import PopupCRUD from './components/PopupCRUD';
import PopupIncomeExpenseForm from './components/PopupIncomeExpenseForm';
import PopupIncomesExpenses from './components/PopupIncomesExpenses';
import PopupManageDB from './components/PopupManageDB';
import { useOnlineStatus } from './components/useOnlineStatus';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_SERVER_URL,
  GOOGLE_SCOPE,
  GOOGLE_SERVICE_IDENTITY_CLIENT,
} from './config';
import {
  getCategoryName,
  handleErrorWithNotifications,
  loadScript,
  sortByFnCreator,
} from './helpers/general';
import {
  type LSDB,
  getDatabasePath as LSGetDatabasePath,
  getLsDB as LSGetLsDB,
  getTokenInfo as LSGetTokenInfo,
  setDatabasePath as LSSetDatabasePath,
  setLsDB as LSSetLsDB,
  setTokenInfo as LSSetTokenInfo,
} from './helpers/localStorage';
import {
  type ItemType,
  actionSchema,
  categorySchema,
  tagSchema,
} from './helpers/schemas';
import { getFormattedLocalDatetime } from './helpers/time';

function redirectToCleanHomePage() {
  window.location.href = window.location.pathname;
}

const queryClient = new QueryClient();

export default function App() {
  const [value, setValue] = useState<string>();
  const [popup, setPopup] = useState<{
    action: 'add' | 'show' | 'showCategories' | 'showTags' | 'manageDB';
    actionType: ItemType;
  }>();
  const [tokenInfo, setTokenInfo] = useState(LSGetTokenInfo());
  const [lsDb, setLsDb] = useState(LSGetLsDB());
  const isOnline = useOnlineStatus();

  const syncTokenInfo = (newTokenInfo?: TokenInfo) => {
    setTokenInfo(newTokenInfo);
    LSSetTokenInfo(newTokenInfo);
  };

  // TODO: probably this can be done with react-query persistent stuff
  const syncLsDB = (lsDb?: LSDB) => {
    setLsDb(lsDb);
    LSSetLsDB(lsDb);
    LSSetDatabasePath(lsDb?.path);
  };

  const handleAddActionFormSubmit = async (data: unknown) => {
    setValue(undefined);
    setPopup(undefined);
    
    if (!lsDb) return;
    
    const parsedData = actionSchema.safeParse(data);
    if (!parsedData.success) return;
    
    const newAction = {
      ...parsedData.data,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    
    const updatedDb = {
      ...lsDb.db,
      actions: [newAction, ...lsDb.db.actions],
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Entrada guardada localmente!', { duration: 2000 });
  };

  const handleEditActionSubmit = (data: unknown) => {
    if (!lsDb) return;
    
    const parsedData = actionSchema.safeParse(data);
    if (!parsedData.success) return;
    
    const editedAction = parsedData.data;
    const updatedActions = lsDb.db.actions.map((action) =>
      action.id === editedAction.id ? editedAction : action
    );
    
    const updatedDb = {
      ...lsDb.db,
      actions: updatedActions,
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Entrada editada localmente!', { duration: 2000 });
  };

  const handleActionDelete = (id: string) => {
    if (!lsDb) return;
    
    const updatedActions = lsDb.db.actions.filter((action) => action.id !== id);
    const updatedDb = {
      ...lsDb.db,
      actions: updatedActions,
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Entrada eliminada localmente!', { duration: 2000 });
  };

  const handleAddCategorySubmit = (data: unknown) => {
    if (!lsDb) return;
    
    const parsedData = categorySchema.safeParse(data);
    if (!parsedData.success) return;
    
    const newCategory = {
      ...parsedData.data,
      id: crypto.randomUUID(),
    };
    
    const updatedDb = {
      ...lsDb.db,
      categories: [newCategory, ...lsDb.db.categories],
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Categoría agregada localmente!', { duration: 2000 });
  };

  const handleEditCategorySubmit = (data: unknown) => {
    if (!lsDb) return;
    
    const parsedData = categorySchema.safeParse(data);
    if (!parsedData.success) return;
    
    const editedCategory = parsedData.data;
    const updatedCategories = lsDb.db.categories.map((category) =>
      category.id === editedCategory.id ? editedCategory : category
    );
    
    const updatedDb = {
      ...lsDb.db,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Categoría editada localmente!', { duration: 2000 });
  };

  const handleCategoryDelete = (id: string) => {
    if (!lsDb) return;
    
    const updatedCategories = lsDb.db.categories.filter((category) => category.id !== id);
    const updatedDb = {
      ...lsDb.db,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Categoría eliminada localmente!', { duration: 2000 });
  };

  const handleAddTagSubmit = (data: unknown) => {
    if (!lsDb) return;
    
    const parsedData = tagSchema.safeParse(data);
    if (!parsedData.success) return;
    
    const newTag = {
      ...parsedData.data,
      id: crypto.randomUUID(),
    };
    
    const updatedDb = {
      ...lsDb.db,
      tags: [newTag, ...lsDb.db.tags],
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Etiqueta agregada localmente!', { duration: 2000 });
  };

  const handleEditTagSubmit = (data: unknown) => {
    if (!lsDb) return;
    
    const parsedData = tagSchema.safeParse(data);
    if (!parsedData.success) return;
    
    const editedTag = parsedData.data;
    const updatedTags = lsDb.db.tags.map((tag) =>
      tag.id === editedTag.id ? editedTag : tag
    );
    
    const updatedDb = {
      ...lsDb.db,
      tags: updatedTags,
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Etiqueta editada localmente!', { duration: 2000 });
  };

  const handleTagDelete = (id: string) => {
    if (!lsDb) return;
    
    const updatedTags = lsDb.db.tags.filter((tag) => tag.id !== id);
    const updatedDb = {
      ...lsDb.db,
      tags: updatedTags,
      updatedAt: new Date().toISOString(),
    };
    
    syncLsDB({ ...lsDb, db: updatedDb });
    toast.success('Etiqueta eliminada localmente!', { duration: 2000 });
  };

  const handleActionClick = (actionType: ItemType) => {
    if (!value) return;
    setPopup({ action: 'add', actionType });
  };

  const [client, setClient] = useState<google.accounts.oauth2.CodeClient>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
      } catch (err) {
        handleErrorWithNotifications(err);
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="fixed inset-0 flex flex-col overflow-auto">
        <a
          href={GLOBAL_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 self-center font-bold text-blue-300"
        >
          @{GLOBAL_AUTHOR}/{GLOBAL_NAME}@{GLOBAL_APP_VERSION}{' '}
          <span>{isOnline ? '🟢' : '🔴'}</span>
        </a>

        <h2 className="relative mb-1 mt-0 px-4 text-center text-2xl font-bold">
          Recientes
        </h2>

        <div className="flex-grow overflow-auto px-4 py-4">
          {lsDb?.db.actions
            .sort(sortByFnCreator('date', false))
            .slice(0, 10)
            .map((it) => (
              <ItemView
                key={it.id}
                viewType="small"
                id={it.id}
                trackOnly={it.trackOnly}
                withCreditCard={it.withCreditCard}
                title={formatNumberValueToCurrency(it.value)}
                description={getCategoryName(lsDb.db.categories, it.categoryId)}
                texts={[
                  `${
                    it.type === 'expense' ? 'Gasto' : 'Ingreso'
                  } - ${getFormattedLocalDatetime(it.date)}`,
                ]}
              />
            ))}
        </div>
        <div className="relative mb-4 before:absolute before:bottom-full before:left-0 before:h-5 before:w-full before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)] before:content-['']" />

        <div className="flex flex-wrap justify-center gap-2 px-1">
          {!tokenInfo && client ? (
            <Button onClick={() => client.requestCode()}>
              Iniciar sesión con Google
            </Button>
          ) : null}

          {tokenInfo ? (
            <>
              <Button
                onClick={async () => {
                  if (!window.confirm('Cerrar sesión?')) return;
                  syncTokenInfo();
                  syncLsDB();
                  redirectToCleanHomePage();
                }}
              >
                Cerrar sesión
              </Button>

              <Button
                onClick={() =>
                  setPopup({ action: 'manageDB', actionType: 'income' })
                }
              >
                DB
              </Button>
            </>
          ) : null}

          <Button onClick={redirectToCleanHomePage}>Recargar</Button>
        </div>

        <div className="mx-auto mb-2 mt-4 w-1/2 border-b-4 border-b-[#333]" />
        <Calculator
          value={value}
          onButtonClick={setValue}
          onBackspaceLongPress={() => setValue(undefined)}
        />
        <div className="flex gap-2 p-4 pt-0 ch:grow ch:basis-1/2 ch:text-xl">
          <Button
            variant="success"
            className="font-bold"
            onClick={handleActionClick.bind(null, 'income')}
          >
            Ingreso
          </Button>
          <Button
            variant="danger"
            className="font-bold"
            onClick={handleActionClick.bind(null, 'expense')}
          >
            Gasto
          </Button>
        </div>

        <div className="grid h-14 shrink-0 grid-cols-1 gap-px bg-black/20">
          {[
            {
              label: 'Entradas',
              onClick: () =>
                setPopup({ action: 'show', actionType: 'expense' }),
            },
          ].map((it) => (
            <button
              type="button"
              key={it.label}
              onClick={it.onClick}
              className="flex items-center justify-center bg-black/30 px-2 text-center text-xs"
            >
              {it.label}
            </button>
          ))}
        </div>

        <div className="grid h-14 shrink-0 grid-cols-4 gap-px whitespace-pre-line bg-black/20">
          {[
            {
              label: 'Categoría \ningresos',
              onClick: () =>
                setPopup({ action: 'showCategories', actionType: 'income' }),
            },
            {
              label: 'Categoría \ngastos',
              onClick: () =>
                setPopup({ action: 'showCategories', actionType: 'expense' }),
            },
            {
              label: 'Etiqueta \ningresos',
              onClick: () =>
                setPopup({ action: 'showTags', actionType: 'income' }),
            },
            {
              label: 'Etiqueta \ngastos',
              onClick: () =>
                setPopup({ action: 'showTags', actionType: 'expense' }),
            },
          ].map((it) => (
            <button
              type="button"
              key={it.label}
              onClick={it.onClick}
              className="flex items-center justify-center bg-black/90 px-2 text-center text-xs"
            >
              {it.label}
            </button>
          ))}
        </div>

        {lsDb && popup?.action === 'show' ? (
          <PopupIncomesExpenses
            db={lsDb.db}
            onClose={() => setPopup(undefined)}
            onItemDelete={handleActionDelete}
            onEditItemSubmit={handleEditActionSubmit}
          />
        ) : null}

        {lsDb && popup?.action === 'add' && (
          <PopupIncomeExpenseForm
            db={lsDb.db}
            value={value}
            actionType={popup.actionType}
            onSubmit={handleAddActionFormSubmit}
            onClose={() => setPopup(undefined)}
          />
        )}

        {lsDb && popup?.action === 'showCategories' ? (
          <PopupCRUD
            dbNamespace="categories"
            title="Categorías"
            items={lsDb.db.categories}
            actionType={popup.actionType}
            actions={lsDb.db.actions}
            onItemDelete={handleCategoryDelete}
            onEditItemSubmit={handleEditCategorySubmit}
            onNewItemSubmit={handleAddCategorySubmit}
            onClose={() => setPopup(undefined)}
            getItemInfo={({ item, actions }) => ({
              title: item.name,
              description: `Items: ${actions.reduce(
                (t, ac) => (ac.categoryId === item.id ? t + 1 : t),
                0,
              )}`,
              texts: [
                `Prioridad de orden: ${item.sortPriority}`,
                item.description,
              ],
            })}
            formItemElements={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: popup.actionType,
              },
              {
                type: 'input',
                name: 'name',
                required: true,
                label: 'Nombre',
              },
              {
                type: 'inputNumber',
                name: 'sortPriority',
                required: true,
                label: 'Prioridad de orden',
              },
              {
                type: 'inputNumber',
                name: 'expectedPerMonth',
                label: 'Esperado mensual',
              },
              {
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
              {
                type: 'checkbox',
                name: 'archived',
                label: 'Archivar',
              },
            ]}
          />
        ) : null}

        {lsDb && popup?.action === 'showTags' ? (
          <PopupCRUD
            dbNamespace="tags"
            title="Etiquetas"
            items={lsDb.db.tags}
            actionType={popup.actionType}
            actions={lsDb.db.actions}
            onItemDelete={handleTagDelete}
            onEditItemSubmit={handleEditTagSubmit}
            onNewItemSubmit={handleAddTagSubmit}
            onClose={() => setPopup(undefined)}
            getItemInfo={({ item, actions }) => ({
              title: item.name,
              description: `Items: ${actions.reduce(
                (t, ac) =>
                  item.categoryIds.includes(ac.categoryId) ? t + 1 : t,
                0,
              )}`,
              texts: [
                `Prioridad de orden: ${item.sortPriority}`,
                `Esperado mensual: ${formatNumberValueToCurrency(
                  item.expectedPerMonth,
                )}`,
                `Categorías (${item.categoryIds.length}):
                  ${
                    item.categoryIds
                      .map(
                        (id) =>
                          lsDb.db.categories.find((it) => it.id === id)?.name,
                      )
                      .join(', ') || '-'
                  }`,
              ],
            })}
            formItemElements={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: popup.actionType,
              },
              {
                type: 'input',
                name: 'name',
                required: true,
                label: 'Nombre',
              },
              {
                type: 'inputNumber',
                name: 'sortPriority',
                required: true,
                label: 'Prioridad de orden',
              },
              {
                type: 'inputNumber',
                name: 'expectedPerMonth',
                label: 'Esperado mensual',
              },
              {
                type: 'selectMultiple',
                name: 'categoryIds',
                label: 'Categorías',
                options: lsDb.db.categories
                  .filter((it) => it.type === popup.actionType)
                  .sort(sortByFnCreator('sortPriority', false))
                  .map((it) => ({ value: it.id, label: it.name })),
              },
              {
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
            ]}
          />
        ) : null}

        {tokenInfo && popup?.action === 'manageDB' ? (
          <PopupManageDB
            dbPath={lsDb?.path ?? LSGetDatabasePath() ?? ''}
            tokenInfo={tokenInfo}
            currentLsDB={lsDb}
            onDBSync={syncLsDB}
            onClose={() => setPopup(undefined)}
          />
        ) : null}

        <Toaster position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
