import { Fragment, ReactNode, useState } from 'react';
import { ZodSchema } from 'zod';
import { Action, ItemType } from '../helpers/DBHelpers';
import { sortByFnCreator } from '../helpers/general';
import ItemForm, { FormItem } from './ItemForm';
import Popup from './Popup';

type ItemCommon = {
  id: string;
  type: ItemType;
  name: string;
  sortPriority: number;
  description?: string;
  [x: string]: any;
};

interface Props<T extends ItemCommon> {
  items: T[];
  dbNamespace: 'actions' | 'categories' | 'tags' | 'wallets';
  formItemElements: FormItem[];
  title: string;
  actions: Action[];
  actionType: ItemType;
  itemZodSchema: ZodSchema;
  getItemView: (attrs: {
    item: T;
    actions: Action[];
    onRemoveClick: (itemId: string) => void;
    onEditClick: (itemId: string) => void;
  }) => ReactNode;
  onItemDelete: (itemId: string) => void;
  onEditItemSubmit: (item: ItemCommon) => void;
  onNewItemSubmit: (item: ItemCommon) => void;
  onClose: () => void;
}

export default function PopupCRUD<T extends ItemCommon>({
  items,
  title,
  actions,
  ...props
}: Props<T>) {
  const [formItemId, setFormItemId] = useState<string>();
  const parsedItems = items
    .filter((it) => it.type === props.actionType)
    // @ts-ignore todo:
    .sort(sortByFnCreator('name'))
    // @ts-ignore todo:
    .sort(sortByFnCreator('sortPriority', false));

  const handleItemFormSubmit = (data: unknown) => {
    setFormItemId(undefined);

    const item = props.itemZodSchema.parse(data);
    if (item.id === 'new') props.onNewItemSubmit(item);
    else props.onEditItemSubmit(item);
  };

  return (
    <Popup
      title={
        props.actionType === 'expense' ? `${title} Gastos` : `${title} Ingresos`
      }
      subtitle={`(${parsedItems.length})`}
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
            formItems={props.formItemElements.map((ie) => ({
              ...ie,
              // populate fields 'new' and type for new item
              value:
                ie.name === 'id'
                  ? 'new'
                  : ie.name === 'type'
                  ? props.actionType
                  : (ie.defaultValue as any),
            }))}
            onSubmit={handleItemFormSubmit}
            onCancel={() => setFormItemId(undefined)}
          />
        </div>
      ) : null}

      {parsedItems.map((item) =>
        formItemId !== item.id ? (
          <Fragment key={'view' + item.id}>
            {props.getItemView({
              item,
              actions,
              onEditClick: setFormItemId,
              onRemoveClick: props.onItemDelete,
            })}
          </Fragment>
        ) : (
          <ItemForm
            key={'form' + item.id}
            formItems={props.formItemElements.map((ie) => ({
              ...ie,
              value: item[ie.name],
            }))}
            onSubmit={handleItemFormSubmit}
            onCancel={() => setFormItemId(undefined)}
          />
        )
      )}
    </Popup>
  );
}
