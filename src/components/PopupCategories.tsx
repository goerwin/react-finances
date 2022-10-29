import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionCategory, ActionType, DB } from '../helpers/DBValidator';

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
    props.actionType === 'expense'
      ? 'Categorías Gastos'
      : 'Categorías Ingresos';

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
    const { id, name, description } = item || {};

    if (!formItemId) return;

    return (
      <form onSubmit={handleSubmit(handleItemFormSubmit)} ref={itemFormRef}>
        <input type="hidden" {...register('id', { value: id })} />
        <input
          {...register('name', { value: name })}
          type="text"
          placeholder="Nombre"
        />
        <input
          {...register('description', { value: description })}
          type="text"
          placeholder="Descripción"
        />
      </form>
    );
  };

  const categories =
    db[
      props.actionType === 'expense' ? 'expenseCategories' : 'incomeCategories'
    ];

  return (
    <div className="flex fixed inset-0 bg-black justify-center items-center bg-opacity-80 p-4">
      <div className="bg-gray-800 py-4 px-5 rounded-lg text-center w-full">
        <h2 className="text-3xl mt-4 mb-4 font-bold">{title}</h2>

        <div className="h-80 overflow-auto">
          {formItemId === 'new' && (
            <div className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center">
              <div className="grow mr-2 break-words min-w-0">
                {getItemForm()}
              </div>

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
                    <span className="block">{item.name}</span>
                    <span className="block">{item.description}</span>
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
        </div>

        <div className="relative pt-4 mb-4 text-lg font-bold before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-5 before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)]">
          <button onClick={props.onClose}>Cerrar</button>
          <button
            className="btn-success ml-4"
            onClick={() => setFormItemId('new')}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
