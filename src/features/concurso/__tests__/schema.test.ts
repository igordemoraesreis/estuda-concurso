import { concursoInputSchema, arvoreSchema } from '../schema';

test('concurso exige nome não vazio', () => {
  expect(concursoInputSchema.safeParse({ nome: '' }).success).toBe(false);
  expect(concursoInputSchema.safeParse({ nome: 'TRT-4' }).success).toBe(true);
});

test('árvore exige peso entre 1 e 5', () => {
  const ok = { disciplinas: [{ nome: 'P', peso: 3, assuntos: [], topicos: [{ nome: 'X' }] }] };
  const ruim = { disciplinas: [{ nome: 'P', peso: 8, assuntos: [], topicos: [] }] };
  expect(arvoreSchema.safeParse(ok).success).toBe(true);
  expect(arvoreSchema.safeParse(ruim).success).toBe(false);
});

test('árvore rejeita disciplina sem nome', () => {
  const ruim = { disciplinas: [{ nome: '', peso: 3, assuntos: [], topicos: [] }] };
  expect(arvoreSchema.safeParse(ruim).success).toBe(false);
});
