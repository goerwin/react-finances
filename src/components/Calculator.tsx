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
  { name: 'Ingreso', value: 'income' },
  { name: 'Gasto', value: 'expense' },
];

export function applyCalcString(current: string, value: string) {
  if (['', '0'].includes(current) && value === '.') return '0.';

  if (['income', 'expense'].includes(value)) return current;
  if (current.includes('.') && value === '.') return current;

  if (value === 'backspace')
    return current.substring(0, current.length - 1) || '0';

  let newValue = '';
  if (value !== '.' && value !== '0')
    newValue = String(Number(current + value));
  else if (current.includes('.') && value === '0') newValue = current + value;
  else if (value === '0') newValue = String(Number(current + value));
  else newValue = current + value;

  return newValue;
}

type Item = typeof items[0];

export interface Props {
  onButtonClick?: (val: Item) => void;
}

export default function Calculator(props: Props) {
  const inputRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  const handleOnButtonClick = (val: Item) => {
    if (!inputRef.current) return;

    const value = String(val.value);
    const inputValue = inputRef.current?.value || '';

    inputRef.current.value = applyCalcString(inputValue, value);
  };

  return (
    <div className={styles.container}>
      <input type="text" ref={inputRef} />
      {items.map((el) => (
        <button
          key={el.value}
          onClick={() => handleOnButtonClick(el)}
          dangerouslySetInnerHTML={{ __html: String(el.name) }}
        />
      ))}
    </div>
  );
}
