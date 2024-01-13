import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from './Button';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import cn from '../utils/cn';
import { getDatetimeLocalFormattedForInputDate } from '../helpers/time';

type Common = {
  name: string;
  required?: boolean;
  label?: string;
  hidden?: boolean;
};

export type FormItem = Common &
  (
    | ({ type: 'input' } & { value?: string })
    | ({ type: 'checkbox' } & { value?: boolean })
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
  const { register, handleSubmit, setFocus, setValue } = useForm();

  // focus first non hidden input on mount
  useEffect(() => {
    const name = props.formItems.find((it) => it.hidden !== true)?.name;
    name && setFocus(name);
  }, [setFocus]);

  return (
    <form
      className={cn('flex gap-2 pb-2 border-b border-b-zinc-800 mb-6', props.className)}
      onSubmit={handleSubmit(props.onSubmit)}
    >
      <div className="grow flex flex-col items-start gap-1">
        {props.formItems.map(({ name, label, ...it }) => {
          if (it.type === 'input' || it.type === 'checkbox')
            return (
              <fieldset key={name}>
                <label>
                  {label ? `${label}: ` : ''}
                  <input
                    hidden={it.hidden}
                    type={it.type === 'input' ? ' text' : 'checkbox'}
                    placeholder={label}
                    {...register(name, {
                      value: it.value,
                      required: it.required,
                    })}
                  />
                </label>
              </fieldset>
            );

          if (it.type === 'inputNumber')
            return (
              <fieldset key={name}>
                {label ? <label>{label}: </label> : null}
                <input
                  hidden={it.hidden}
                  type="number"
                  step="0.01"
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
              <fieldset key={name} className="flex items-center gap-2">
                {label ? <label>{label}: </label> : null}
                <select
                  hidden={it.hidden}
                  multiple={it.type === 'selectMultiple'}
                  placeholder={label}
                  {...register(name, {
                    value: it.value ?? [],
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
                <Button size="iconSmall" onClick={() => setValue(name, [])}>
                  <FaXmark />
                </Button>
              </fieldset>
            );

          if (it.type === 'inputDate') {
            return (
              <fieldset key={name}>
                {label ? <label>{label}: </label> : null}
                <input
                  type="datetime-local"
                  {...register(name, {
                    value: it.value
                      ? getDatetimeLocalFormattedForInputDate(it.value)
                      : '',
                    required: it.required,
                    setValueAs: (val) =>
                      val ? new Date(val).toISOString() : undefined,
                  })}
                />
              </fieldset>
            );
          }
        })}
      </div>

      <div className="flex gap-2">
        <Button size="icon" variant="success" type="submit">
          <FaCheck />
        </Button>
        <Button
          size="icon"
          variant="danger"
          type="submit"
          onClick={props.onCancel}
        >
          <FaXmark />
        </Button>
      </div>
    </form>
  );
}
