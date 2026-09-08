import { salvarSessaoCronometro } from '../api';

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
  },
}));

test('salvarSessaoCronometro insere com origem cronometro', async () => {
  await salvarSessaoCronometro({
    topicoId: 't1',
    iniciadaEm: '2026-09-01T10:00:00Z',
    duracaoSegundos: 1500,
  });
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({
      user_id: 'u1',
      topico_id: 't1',
      duracao_segundos: 1500,
      origem: 'cronometro',
    }),
  );
});
