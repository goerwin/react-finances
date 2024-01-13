import Button from './Button';
import If from './If';
import { FaPencil, FaTrash } from 'react-icons/fa6';

interface Props {
  id: string;
  title: string;
  description?: string | number;
  trackOnly?: boolean;
  withCreditCard?: boolean;
  texts?: (string | undefined)[];
  viewType?: 'small';
  onEditClick?: (id: string) => void;
  onRemoveClick?: (id: string) => void;
}

export default function ItemView(props: Props) {
  return (
    <div className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center">
      <div className="grow mr-2 break-words min-w-0">
        <span className="block">
          <span>
            {props.title} {props.trackOnly ? '🦶' : null}{' '}
            {props.withCreditCard ? '💳' : null}
          </span>
          {props.description ? (
            <span className="c-description text-xs"> {props.description}</span>
          ) : null}
        </span>
        {props.texts?.map((it, idx) =>
          it ? (
            <span key={idx} className="block text-xs italic text-white/50">
              {it}
            </span>
          ) : null
        )}
      </div>

      <If condition={props.viewType !== 'small'}>
        <div className="flex gap-2 max-h-10">
          <Button
            size="icon"
            variant="success"
            onClick={() => props.onEditClick?.(props.id)}
          >
            <FaPencil />
          </Button>

          <Button
            size="icon"
            variant="danger"
            onClick={() => {
              if (window.confirm(`Eliminar este item (${props.title})?`))
                props.onRemoveClick?.(props.id);
            }}
          >
            <FaTrash />
          </Button>
        </div>
      </If>
    </div>
  );
}
