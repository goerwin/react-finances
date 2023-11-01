interface Props {
  id: string;
  title: string;
  description?: string | number;
  trackOnly?: boolean;
  texts?: (string | undefined)[];
  onEditClick?: (id: string) => void;
  onRemoveClick?: (id: string) => void;
}

export default function ItemView(props: Props) {
  return (
    <div className="mb-2 pb-2 border-b border-white/20 text-left relative flex items-center">
      <div className="grow mr-2 break-words min-w-0">
        <span className="block">
          <span className={props.trackOnly ? 'c-description' : ''}>
            {props.title}
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

      <div className="flex gap-2 max-h-10">
        <button
          className="btn-success p-0 text-2xl h-10 aspect-square"
          onClick={() => props.onEditClick?.(props.id)}
        >
          ✎
        </button>
        <button
          className="btn-danger p-0 text-2xl h-10 aspect-square"
          onClick={() => {
            if (window.confirm(`Eliminar este item (${props.title})?`))
              props.onRemoveClick?.(props.id);
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
