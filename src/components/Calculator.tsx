import { MutableRefObject, useRef } from 'react';
import { useLongPress } from 'use-long-press';

const items: { name: string | number; value: string | number }[] = [
  { name: 1, value: 1 },
  { name: 2, value: 2 },
  { name: 3, value: 3 },
  { name: 4, value: 4 },
  { name: 5, value: 5 },
  { name: 6, value: 6 },
  { name: 7, value: 7 },
  { name: 8, value: 8 },
  { name: 9, value: 9 },
  { name: '.', value: '.' },
  { name: 0, value: 0 },
  { name: '&#9003;', value: 'backspace' },
];

export function applyCalcString(current: string, input: string) {
  if (input === 'backspace') return current.slice(0, -1) || '0';

  const [integer, decimal] = current.split('.');

  if (['', '0'].includes(integer) && input === '.') return '0.';
  if (decimal !== undefined && input === '.') return current;
  if (decimal !== undefined) return current + input;
  if (input === '.') return integer + input;

  return String(Number(integer + input));
}

export function formatNumberValueToCurrency(value?: number | string) {
  value = String(value || 0);
  const [integerStr, decimalStr] = value.split('.');
  const parsedValueStr = Number(
    integerStr + (decimalStr ? `.${decimalStr}` : '')
  ).toFixed(0);

  return `${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
  }).format(Number(parsedValueStr))}`;
}

export function removeCurrencyFormattingToValue(value: string) {
  return value.replace(/,|\$/g, '');
}

type Item = typeof items[0];

export interface Props {
  value?: string;
  onButtonClick: (value: string) => void;
  onBackspaceLongPress?: () => void;
}

export default function Calculator(props: Props) {
  const spanValueRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  const backspaceBind = useLongPress(() => props.onBackspaceLongPress?.());

  const handleButtonClick = (val: Item) => {
    if (!spanValueRef.current) return;

    const value = String(val.value);
    const inputValue = spanValueRef.current?.value || '';

    props.onButtonClick(
      formatNumberValueToCurrency(
        applyCalcString(removeCurrencyFormattingToValue(inputValue), value)
      )
    );
  };

  return (
    <div className="p-2">
      <input
        className="text-[3em] w-full border-0 text-center bg-transparent p-0 outline-none font-bold"
        readOnly
        type="text"
        ref={spanValueRef}
        value={props.value || '$0'}
      />

      <div className="grid grid-cols-3 grid-rows-4 p-2 gap-px mx-auto max-w-[200px] w-full ch:select-none ch:bg-calculatorBtn ch:rounded-md ch:text-3xl ch:py-2 ch:px-1 ch:text-center ch:border-0 ch:font-bold">
        {items.map((el) => (
          <button
            className="active:outline-2 active:outline-white focus:outline-none"
            key={el.value}
            onClick={() => handleButtonClick(el)}
            {...(el.value === 'backspace' ? backspaceBind() : {})}
            dangerouslySetInnerHTML={{ __html: String(el.name) }}
          />
        ))}
      </div>
    </div>
  );
}
