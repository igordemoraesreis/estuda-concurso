import { sessaoExercicioSchema } from '../schema';

test('aceita sessão válida', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '2026-09-01', acertos: 8, erros: 2 }).success).toBe(true);
});

test('rejeita total zero', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '2026-09-01', acertos: 0, erros: 0 }).success).toBe(false);
});

test('rejeita números negativos', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '2026-09-01', acertos: -1, erros: 2 }).success).toBe(false);
});

test('rejeita data mal formatada', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '01/09/2026', acertos: 1, erros: 0 }).success).toBe(false);
});
