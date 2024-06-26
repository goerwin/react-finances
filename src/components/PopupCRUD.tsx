import { useState } from 'react';
import {
  Action,
  Category,
  ItemType,
  DBListItem,
  Tag,
} from '../helpers/schemas';
import { sortByFnCreator } from '../helpers/general';
import ItemForm, { FormItem } from './ItemForm';
import ItemView from './ItemView';
import Popup from './Popup';
import Button from './Button';

type ActionOrCategory = SafeIntersection<Action, Category>;
type ActionCategoryOrRecord = SafeIntersection<ActionOrCategory, Tag>;
type ItemCommon = SafeIntersection<
  ActionCategoryOrRecord,
  // eslint-disable-next-line
  { [x: string]: any }
>;

interface Props<T extends ItemCommon> {
  items: T[];
  dbNamespace: DBListItem;
  formItemElements: FormItem[];
  title: string;
  actions: Action[];
  actionType: ItemType;
  getItemInfo: (attrs: { item: T; actions: Action[] }) => {
    title: string;
    description?: string;
    texts?: (string | undefined)[];
  };
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
    // @ts-expect-error todo:
    .sort(sortByFnCreator('name'))
    // @ts-expect-error todo:
    .sort(sortByFnCreator('sortPriority', false));

  // eslint-disable-next-line
  const handleItemFormSubmit = (data: any) => {
    setFormItemId(undefined);

    if (data?.id === 'new') props.onNewItemSubmit(data);
    else props.onEditItemSubmit(data);
  };

  return (
    <Popup
      title={
        props.actionType === 'expense' ? `${title} Gastos` : `${title} Ingresos`
      }
      subtitle={`(${parsedItems.length})`}
      bottomArea={
        <div className="flex gap-4 align-middle justify-center">
          <Button onClick={props.onClose}>Cerrar</Button>
          <Button variant="success" onClick={() => setFormItemId('new')}>
            Agregar
          </Button>
        </div>
      }
    >
      {formItemId === 'new' ? (
        <div className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center">
          <ItemForm
            formItems={props.formItemElements.map((ie) => ({
              ...ie,
              // populate field id as 'new' new item
              // eslint-disable-next-line
              value: ie.name === 'id' ? 'new' : (ie.value as any),
            }))}
            onSubmit={handleItemFormSubmit}
            onCancel={() => setFormItemId(undefined)}
          />
        </div>
      ) : null}

      {parsedItems.map((item) => {
        const resp = props.getItemInfo({ item, actions });

        return formItemId !== item.id ? (
          <ItemView
            key={'view' + item.id}
            id={item.id}
            title={resp.title}
            description={resp.description}
            texts={resp.texts}
            onRemoveClick={props.onItemDelete}
            onEditClick={setFormItemId}
          />
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
        );
      })}
    </Popup>
  );
}
