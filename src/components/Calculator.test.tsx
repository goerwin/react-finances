import { test, expect } from 'vitest';
import { applyCalcString } from './Calculator';

test('applyCalcString', () => {
  const inputOutputs = [
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

  inputOutputs.forEach((el) => {
    expect(applyCalcString(el[0], el[1])).toEqual(el[2]);
  });
});
