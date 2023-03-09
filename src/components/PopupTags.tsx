import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ItemType, DB, Tag } from '../helpers/DBHelpers';
import { sortByFnCreator } from '../helpers/general';
import {
  getDateFormattedForInput,
  getFormattedLocalDate,
} from '../helpers/time';
import { formatNumberValueToCurrency } from './Calculator';
import Popup from './Popup';

export interface Props {
  db: DB;
  actionType: ItemType;
  onItemDelete: (itemId: string) => void;
  onEditItemSubmit: (item: Tag) => void;
  onNewItemSubmit: (item: Tag, type: ItemType) => void;
  onClose: () => void;
}

export default function PopupTags({ db, ...props }: Props) {
  const itemFormRef = useRef<HTMLFormElement | null>(null);
  const [formItemId, setFormItemId] = useState<string>();

  const { register, handleSubmit, reset } = useForm<Tag>({
    shouldUnregister: true,
  });

  const title =
    props.actionType === 'expense' ? 'Etiquetas Gastos' : 'Etiquetas Ingresos';

  const allCategories = db.categories.filter(
    (it) => it.type === props.actionType
  );

  const tags = db.tags
    .filter((it) => it.type === props.actionType)
    .sort(sortByFnCreator('name'))
    .sort(sortByFnCreator('sortPriority', false));

  const manuallySubmitForm = () => {
    itemFormRef.current?.dispatchEvent(
      new Event('submit', {
        cancelable: true,
        bubbles: true,
      })
    );
  };

  const handleItemFormSubmit = (item: Tag) => {
    setFormItemId(undefined);
    itemFormRef.current = null;

    if (!formItemId) return;

    item.startDate = item.startDate
      ? new Date(item.startDate).toISOString()
      : undefined;

    item.expectedPerMonth = isNaN(Number(item.expectedPerMonth))
      ? undefined
      : item.expectedPerMonth;

    if (formItemId === 'new') props.onNewItemSubmit(item, props.actionType);
    else props.onEditItemSubmit(item);
  };

  const getItemForm = (item?: Tag) => {
    const { id, name, sortPriority, expectedPerMonth, categoryIds, startDate } =
      item || {};

    if (!formItemId) return;

    return (
      <form onSubmit={handleSubmit(handleItemFormSubmit)} ref={itemFormRef}>
        <input type="hidden" {...register('id', { value: id })} />
        <input
          className="mb-1"
          {...register('name', { required: true, value: name })}
          type="text"
          placeholder="Nombre"
        />
        <input
          className="mb-1"
          {...register('expectedPerMonth', {
            value: expectedPerMonth,
            valueAsNumber: true,
          })}
          type="number"
          placeholder="Esperado mensual"
        />
        <input
          className="mb-1"
          {...register('sortPriority', {
            required: true,
            value: sortPriority || 0,
            valueAsNumber: true,
          })}
          type="number"
          placeholder="Prioridad de orden"
        />
        <select
          {...register('categoryIds', { required: true, value: categoryIds })}
          multiple
          className="w-full"
          placeholder="Categorías"
        >
          {allCategories.map((el) => (
            <option key={el.id} value={el.id}>
              {el.name}
            </option>
          ))}
        </select>

        <fieldset className="mb-2">
          <label>Día inicial: </label>
          <input
            type="date"
            {...register('startDate', {
              value: startDate ? getDateFormattedForInput(startDate) : '',
              // val is yyyy-MM-dd
              // append T00:00 to convert it to local date
              setValueAs: (val) => (val ? new Date(val + 'T00:00') : ''),
            })}
          />
        </fieldset>

        <button type="submit" hidden />
      </form>
    );
  };

  return (
    <Popup
      title={title}
      subtitle={`(${tags.length})`}
      bottomArea={
        <>
          <button onClick={props.onClose}>Cerrar</button>
          <button
            className="btn-success ml-4"
            onClick={() => {
              reset();
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

      {tags.map((item) => (
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
                        item.categoryIds.includes(action.categoryId ?? '')
                          ? count + 1
                          : count,
                      0
                    )}
                  </span>
                </span>
                <span className="block c-description">
                  Prioridad de orden: {item.sortPriority}
                </span>

                <span className="block c-description">
                  Esperado mensual:{' '}
                  {formatNumberValueToCurrency(item.expectedPerMonth ?? 0)}
                </span>

                <span className="block c-description">
                  Día inicial:{' '}
                  {item.startDate ? getFormattedLocalDate(item.startDate) : '-'}
                </span>

                <span className="block c-description">
                  Categorías {`(${item.categoryIds.length}): `}
                  {item.categoryIds
                    .map(
                      (catId) =>
                        allCategories.find((cat) => cat.id === catId)?.name
                    )
                    .join(', ')}
                </span>
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
                      `Seguro que quieres eliminar esta etiqueta (${item.name})?`
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
