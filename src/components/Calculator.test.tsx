import { test, expect } from 'vitest';
import {
  applyCalcString,
  formatNumberValueToCurrency,
  removeCurrencyFormattingToValue,
} from './Calculator';

test('calculator input should work as expected', () => {
  const currentInputOutputs = [
    ['', '.', '0.'],
    ['0', '.', '0.'],
    ['', '1', '1'],
    ['1', '9', '19'],
    ['1', '.', '1.'],
    ['1.', '.', '1.'],
    ['1', '0', '10'],
    ['1.', '0', '1.0'],
    ['1.0', '0', '1.00'],
    ['1.00', '2', '1.002'],
    ['1.00', '.', '1.00'],
    ['21', '.', '21.'],
    ['21.', '.', '21.'],
    ['21.', '4', '21.4'],
    ['0', '0', '0'],
    ['0', '7', '7'],
    ['', 'backspace', '0'],
    ['0', 'backspace', '0'],
    ['0.', 'backspace', '0'],
    ['0.1', 'backspace', '0.'],
    ['0.12', 'backspace', '0.1'],
    ['0.120', 'backspace', '0.12'],
    ['0.1200', 'backspace', '0.120'],
    ['1.', 'backspace', '1'],
    ['1.2', 'backspace', '1.'],
  ];

  currentInputOutputs.forEach((el) => {
    expect(applyCalcString(el[0], el[1])).toEqual(el[2]);
  });
});

test('format number should be converted to currency', () => {
  const inputOutputs = [
    ['0', '$0'],
    ['12', '$12'],
    ['1200', '$1,200'],
    ['1200.45', '$1,200.45'],
    ['12000.400', '$12,000.4'],
    ['120000.400', '$120,000.4'],
    ['1200000.400', '$1,200,000.4'],
    ['12000000.', '$12,000,000'],
  ];

  inputOutputs.forEach((el) => {
    expect(formatNumberValueToCurrency(el[0])).toEqual(el[1]);
  });
});

test('remove currency formatting to value', () => {
  const inputOutputs = [
    ['$0', '0'],
    ['$12', '12'],
    ['$1,200', '1200'],
    ['$1,200.45', '1200.45'],
    ['$12,000.400', '12000.400'],
    ['$120,000.400', '120000.400'],
    ['$1,200,000.400', '1200000.400'],
    ['$12,000,000.', '12000000.'],
  ];

  inputOutputs.forEach((el) => {
    expect(removeCurrencyFormattingToValue(el[0])).toEqual(el[1]);
  });
});
