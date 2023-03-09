import { useState } from 'react';
import { ItemType, Category, categorySchema, DB } from '../helpers/DBHelpers';
import { sortByFnCreator } from '../helpers/general';
import ItemForm from './ItemForm';
import ItemView from './ItemView';
import Popup from './Popup';

export interface Props {
  db: DB;
  actionType: ItemType;
  onItemDelete: (itemId: string) => void;
  onEditItemSubmit: (item: Category) => void;
  onNewItemSubmit: (item: Category) => void;
  onClose: () => void;
}

export default function PopupCategories({ db, ...props }: Props) {
  const [formItemId, setFormItemId] = useState<string>();

  const title =
    props.actionType === 'expense' ? 'Categoría Gastos' : 'Categoría Ingresos';

  const categories = db.categories
    .filter((it) => it.type === props.actionType)
    .sort(sortByFnCreator('name'))
    .sort(sortByFnCreator('sortPriority', false));

  const handleItemFormSubmit = (data: unknown) => {
    setFormItemId(undefined);

    const item = categorySchema.parse(data);
    if (item.id === 'new') props.onNewItemSubmit(item);
    else props.onEditItemSubmit(item);
  };

  return (
    <Popup
      title={title}
      subtitle={`(${categories.length})`}
      bottomArea={
        <>
          <button onClick={props.onClose}>Cerrar</button>
          <button
            className="btn-success ml-4"
            onClick={() => setFormItemId('new')}
          >
            Agregar
          </button>
        </>
      }
    >
      {formItemId === 'new' ? (
        <div className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center">
          <ItemForm
            formItems={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
                value: 'new',
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: props.actionType,
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
                type: 'input',
                name: 'description',
                label: 'Descripción',
              },
            ]}
            onSubmit={handleItemFormSubmit}
            onCancel={() => setFormItemId(undefined)}
          />
        </div>
      ) : null}

      {categories.map((item) =>
        formItemId !== item.id ? (
          <ItemView
            key={'view' + item.id}
            id={item.id}
            title={item.name}
            description={`Items: ${db.actions.reduce(
              (t, ac) => (ac.categoryId === item.id ? t + 1 : t),
              0
            )}`}
            texts={[
              `Prioridad de orden: ${item.sortPriority}`,
              item.description,
            ]}
            onRemoveClick={props.onItemDelete}
            onEditClick={setFormItemId}
          />
        ) : (
          <ItemForm
            key={'form' + item.id}
            formItems={[
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'id',
                value: item.id,
              },
              {
                type: 'input',
                required: true,
                hidden: true,
                name: 'type',
                value: item.type,
              },
              {
                type: 'input',
                name: 'name',
                required: true,
                label: 'Nombre',
                value: item.name,
              },
              {
                type: 'inputNumber',
                name: 'sortPriority',
                required: true,
                label: 'Prioridad de orden',
                value: item.sortPriority,
              },
              {
                type: 'input',
                name: 'description',
                label: 'Descripción',
                value: item.description,
              },
            ]}
            onSubmit={handleItemFormSubmit}
            onCancel={() => setFormItemId(undefined)}
          />
        )
      )}
    </Popup>
  );
}
