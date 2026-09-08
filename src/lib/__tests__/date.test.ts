import { hojeISO, formatarDataBR } from '../date';

test('formatarDataBR interpreta AAAA-MM-DD como data local (não UTC)', () => {
  expect(formatarDataBR('2026-09-01')).toBe('01/09/2026');
  expect(formatarDataBR('2026-01-01')).toBe('01/01/2026');
  expect(formatarDataBR('2026-12-31')).toBe('31/12/2026');
});

test('formatarDataBR devolve a entrada quando não é data', () => {
  expect(formatarDataBR('não é data')).toBe('não é data');
});

test('formatarDataBR aceita timestamp ISO completo', () => {
  // Meio-dia UTC cai no mesmo dia civil em qualquer fuso entre UTC-11 e UTC+11.
  expect(formatarDataBR('2026-09-01T12:00:00Z')).toBe('01/09/2026');
});

test('hojeISO usa os componentes locais da data', () => {
  // 1º de setembro às 00:30 no fuso local: em UTC-3 o ISO UTC já seria 01/09T03:30,
  // mas em UTC+3 seria 31/08T21:30 — hojeISO tem de dizer 2026-09-01 nos dois casos.
  expect(hojeISO(new Date(2026, 8, 1, 0, 30))).toBe('2026-09-01');
  expect(hojeISO(new Date(2026, 8, 1, 23, 30))).toBe('2026-09-01');
  expect(hojeISO(new Date(2026, 0, 5))).toBe('2026-01-05');
});
