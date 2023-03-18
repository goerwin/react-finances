import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getDateFormattedForInput } from '../helpers/time';

type Common = {
  name: string;
  required?: boolean;
  label?: string;
  hidden?: boolean;
};

export type FormItem = Common &
  (
    | ({ type: 'input' } & { value?: string })
    | ({ type: 'inputNumber' } & { value?: number })
    | ({ type: 'inputDate' } & { value?: string })
    | ({ type: 'select' } & {
        value?: string;

        options: { label: string; value: string }[];
      })
    | ({ type: 'selectMultiple' } & {
        value?: string[];
        options: { label: string; value: string }[];
      })
  );

export interface Props {
  formItems: FormItem[];
  onCancel?: () => void;
  className?: React.HTMLAttributes<HTMLFormElement>['className'];
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
    <form
      className={`flex gap-2 ${props.className}`}
      onSubmit={handleSubmit(props.onSubmit)}
    >
      <div className="grow">
        {props.formItems.map(({ name, label, ...it }) => {
          if (it.type === 'input')
            return (
              <fieldset key={name}>
                {label ? <label>{label}</label> : null}
                <input
                  hidden={it.hidden}
                  type="text"
                  placeholder={label}
                  {...register(name, {
                    value: it.value,
                    required: it.required,
                  })}
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
                    value: it.value,
                    setValueAs: (val) => (val === '' ? undefined : Number(val)),
                    required: it.required,
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
                  {...register(name, {
                    value: it.value ?? '',
                    required: it.required,
                  })}
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

          if (it.type === 'inputDate') {
            return (
              <fieldset key={name}>
                {label ? <label>{label}</label> : null}
                <input
                  type="date"
                  {...register(name, {
                    value: it.value ? getDateFormattedForInput(it.value) : '',
                    required: it.required,

                    // val is yyyy-MM-dd
                    // append T00:00 to convert it to local date
                    setValueAs: (val) =>
                      val ? new Date(val + 'T00:00').toISOString() : undefined,
                  })}
                />
              </fieldset>
            );
          }
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
  );
}
