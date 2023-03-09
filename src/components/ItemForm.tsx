import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

type Common = {
  name: string;
  required?: boolean;
  label?: string;
  hidden?: boolean;
};

export type FormItem = Common &
  (
    | ({ type: 'input' } & { value?: string; defaultValue?: string })
    | ({ type: 'inputNumber' } & { value?: number; defaultValue?: number })
    | ({ type: 'select' } & {
        value?: string;
        defaultValue?: string;
        options: { label: string; value: string }[];
      })
    | ({ type: 'selectMultiple' } & {
        value?: string[];
        defaultValue?: string[];
        options: { label: string; value: string }[];
      })
  );

export interface Props {
  formItems: FormItem[];
  onCancel?: () => void;
  onSubmit: (data: unknown) => void;
}

export default function ItemForm(props: Props) {
  const { register, handleSubmit, setFocus } = useForm();

  // focus first non hidden input on mount
  useEffect(() => {
    const name = props.formItems.find((it) => it.hidden !== true)?.name;
    name && setFocus(name);
  }, [setFocus]);

  return (
    <form className="flex gap-2" onSubmit={handleSubmit(props.onSubmit)}>
      <div className="grow">
        {props.formItems.map(({ value, name, label, ...it }) => {
          if (it.type === 'input')
            return (
              <fieldset key={name}>
                {label ? <label>{label}</label> : null}
                <input
                  hidden={it.hidden}
                  type="text"
                  placeholder={label}
                  {...register(name, { value, required: it.required })}
                />
              </fieldset>
            );

          if (it.type === 'inputNumber')
            return (
              <fieldset key={name}>
                {label ? <label>{label}</label> : null}
                <input
                  hidden={it.hidden}
                  type="number"
                  placeholder={label}
                  {...register(name, {
                    value,
                    required: it.required,
                    valueAsNumber: true,
                  })}
                />
              </fieldset>
            );

          if (it.type === 'select' || it.type === 'selectMultiple')
            return (
              <fieldset key={name}>
                {label ? <label>{label}</label> : null}
                <select
                  hidden={it.hidden}
                  multiple={it.type === 'selectMultiple'}
                  placeholder={label}
                  {...register(name, { value, required: it.required })}
                >
                  <option value="" disabled>
                    {label}
                  </option>
                  {it.options.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            );
        })}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-success p-0 text-2xl h-10 aspect-square"
          type="submit"
        >
          ✓
        </button>
        <button
          type="button"
          className="btn-danger p-0 text-2xl h-10 aspect-square"
          onClick={props.onCancel}
        >
          x
        </button>
      </div>
    </form>
    // <form onSubmit={handleSubmit(handleItemFormSubmit)} ref={itemFormRef}>
    //   <input type="hidden" {...register('id', { value: id })} />
    //   <input
    //     className="mb-1"
    //     {...register('name', { required: true, value: name })}
    //     type="text"
    //     placeholder="Nombre"
    //   />
    //   <input
    //     className="mb-1"
    //     {...register('sortPriority', {
    //       required: true,
    //       value: sortPriority,
    //       valueAsNumber: true,
    //     })}
    //     type="number"
    //     placeholder="Prioridad de orden"
    //   />
    //   <input
    //     className="mb-1"
    //     {...register('description', { value: description })}
    //     type="text"
    //     placeholder="Descripción"
    //   />
    //   <button type="submit" hidden />
    // </form>
  );
}
