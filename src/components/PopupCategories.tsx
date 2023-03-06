import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionCategory, ActionType, DB } from '../helpers/DBHelpers';
import { sortByFnCreator } from '../helpers/general';
import Popup from './Popup';

export interface Props {
  db: DB;
  actionType: ActionType;
  onItemDelete: (itemId: string) => void;
  onEditItemSubmit: (item: ActionCategory) => void;
  onNewItemSubmit: (item: ActionCategory, type: ActionType) => void;
  onClose: () => void;
}

export default function PopupCategories({ db, ...props }: Props) {
  const itemFormRef = useRef<HTMLFormElement | null>(null);
  const [formItemId, setFormItemId] = useState<string>();

  const { register, handleSubmit, reset } = useForm<ActionCategory>({
    shouldUnregister: true,
  });

  const title =
    props.actionType === 'expense' ? 'Categoría Gastos' : 'Categoría Ingresos';

  const manuallySubmitForm = () => {
    itemFormRef.current?.dispatchEvent(
      new Event('submit', {
        cancelable: true,
        bubbles: true,
      })
    );
  };

  const handleItemFormSubmit = (item: ActionCategory) => {
    setFormItemId(undefined);
    itemFormRef.current = null;

    if (!formItemId) return;
    if (formItemId === 'new') props.onNewItemSubmit(item, props.actionType);
    else props.onEditItemSubmit(item);
  };

  const getItemForm = (item?: ActionCategory) => {
    const { id, name, description, sortPriority } = item || {};

    if (!formItemId) return;

    return (
      <form onSubmit={handleSubmit(handleItemFormSubmit)} ref={itemFormRef}>
        <input type="hidden" {...register('id', { value: id })} />
        <input
          className="mb-1"
          {...register('name', { value: name })}
          type="text"
          placeholder="Nombre"
        />
        <input
          className="mb-1"
          {...register('sortPriority', {
            value: sortPriority,
            valueAsNumber: true,
          })}
          type="number"
          placeholder="Prioridad de orden"
        />
        <input
          className="mb-1"
          {...register('description', { value: description })}
          type="text"
          placeholder="Descripción"
        />
        <button type="submit" hidden />
      </form>
    );
  };

  const categories = [
    ...db[
      props.actionType === 'expense' ? 'expenseCategories' : 'incomeCategories'
    ],
  ]
    .sort(sortByFnCreator('name'))
    .sort(sortByFnCreator('sortPriority', false));

  return (
    <Popup
      title={title}
      bottomArea={
        <>
          <button onClick={props.onClose}>Cerrar</button>
          <button
            className="btn-success ml-4"
            onClick={() => {
              setFormItemId('new');
              setTimeout(() =>
                itemFormRef.current
                  ?.querySelector<HTMLInputElement>('input[name="name"]')
                  ?.focus()
              );
            }}
          >
            Agregar
          </button>
        </>
      }
    >
      {formItemId === 'new' && (
        <div className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center">
          <div className="grow mr-2 break-words min-w-0">{getItemForm()}</div>

          <div className="flex gap-2 max-h-10">
            <button
              className="btn-success p-0 text-2xl h-10 aspect-square"
              onClick={manuallySubmitForm}
            >
              ✓
            </button>
            <button
              className="btn-danger p-0 text-2xl h-10 aspect-square"
              onClick={() => setFormItemId(undefined)}
              dangerouslySetInnerHTML={{ __html: '&times;' }}
            />
          </div>
        </div>
      )}

      {categories.map((item) => (
        <div
          key={item.id}
          className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center"
        >
          <div className="grow mr-2 break-words min-w-0">
            {formItemId !== item.id && (
              <>
                <span className="block">
                  {item.name}{' '}
                  <span className="c-description text-xs">
                    Items:{' '}
                    {db.actions.reduce(
                      (count, action) =>
                        action[
                          props.actionType === 'expense'
                            ? 'expenseCategory'
                            : 'incomeCategory'
                        ] === item.id
                          ? count + 1
                          : count,
                      0
                    )}
                  </span>
                </span>
                <span className="block c-description">
                  Prioridad de orden: {item.sortPriority}
                </span>
                <span className="block c-description">{item.description}</span>
              </>
            )}
            {formItemId === item.id && getItemForm(item)}
          </div>

          <div className="flex gap-2 max-h-10">
            {formItemId !== item.id && (
              <>
                <button
                  className="btn-success p-0 text-2xl h-10 aspect-square"
                  onClick={() => {
                    reset();
                    setFormItemId(item.id);
                  }}
                >
                  ✎
                </button>
                <button
                  className="btn-danger p-0 text-2xl h-10 aspect-square"
                  onClick={async () => {
                    const resp = window.confirm(
                      `Seguro que quieres eliminar esta categoría (${item.name})?`
                    );

                    if (!resp) return;
                    props.onItemDelete(item.id);
                  }}
                >
                  🗑
                </button>
              </>
            )}

            {formItemId === item.id && (
              <>
                <button
                  className="btn-success p-0 text-2xl h-10 aspect-square"
                  onClick={manuallySubmitForm}
                >
                  ✓
                </button>
                <button
                  className="btn-danger p-0 text-2xl h-10 aspect-square"
                  onClick={() => setFormItemId(undefined)}
                  dangerouslySetInnerHTML={{ __html: '&times;' }}
                />
              </>
            )}
          </div>
        </div>
      ))}
    </Popup>
  );
}
