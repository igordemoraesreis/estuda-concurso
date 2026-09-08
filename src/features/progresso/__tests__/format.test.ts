import { formatarPct, formatarDuracao } from '../format';

test('formatarPct arredonda e trata null', () => {
  expect(formatarPct(0.734)).toBe('73%');
  expect(formatarPct(1)).toBe('100%');
  expect(formatarPct(null)).toBe('—');
});

test('formatarDuracao', () => {
  expect(formatarDuracao(0)).toBe('0min');
  expect(formatarDuracao(2700)).toBe('45min');
  expect(formatarDuracao(8100)).toBe('2h 15min');
  expect(formatarDuracao(7200)).toBe('2h');
});
