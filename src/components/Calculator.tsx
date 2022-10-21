import { MutableRefObject, useRef } from 'react';
import styles from './Calculator.module.css';

const items = [
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

// TODO:
// $3,000,000	2022/10/01

export function formatNumberValueToCurrency(value: string) {
  const [integer, decimal] = value.split('.');

  const integerFormatted = `${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
  }).format(Number(integer))}`;

  return `${integerFormatted}${decimal === undefined ? '' : `.${decimal}`}`;
}

export function removeCurrencyFormattingToValue(value: string) {
  return value.replace(/,|\$/g, '');
}

type Item = typeof items[0];

export interface Props {
  onButtonClick?: (val: Item) => void;
}

export default function Calculator(props: Props) {
  const spanValueRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  const handleOnButtonClick = (val: Item) => {
    if (!spanValueRef.current) return;

    const value = String(val.value);
    const inputValue = spanValueRef.current?.value || '';

    spanValueRef.current.value = formatNumberValueToCurrency(
      applyCalcString(removeCurrencyFormattingToValue(inputValue), value)
    );
  };

  return (
    <div className={styles.container}>
      <input
        className={styles.inputValue}
        type="text"
        ref={spanValueRef}
        defaultValue="$0"
      />

      <div className={styles.buttonsContainer}>
        {items.map((el) => (
          <button
            key={el.value}
            onClick={() => handleOnButtonClick(el)}
            dangerouslySetInnerHTML={{ __html: String(el.name) }}
          />
        ))}
      </div>
    </div>
  );
}
