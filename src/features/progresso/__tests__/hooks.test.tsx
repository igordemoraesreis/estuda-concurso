import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgresso } from '../hooks';

jest.mock('@/features/edital/api', () => ({
  carregarArvore: () =>
    Promise.resolve({
      disciplinas: [
        {
          id: 'd1',
          nome: 'Português',
          peso: 5,
          ordem: 0,
          assuntos: [],
          topicos: [
            {
              id: 't1',
              nome: 'A',
              disciplina_id: 'd1',
              assunto_id: null,
              ordem: 0,
              concluido: true,
              concluido_em: null,
            },
            {
              id: 't2',
              nome: 'B',
              disciplina_id: 'd1',
              assunto_id: null,
              ordem: 1,
              concluido: false,
              concluido_em: null,
            },
          ],
        },
      ],
    }),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }),
  },
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>{children}</QueryClientProvider>
);

test('calcula cobertura 0.5 e ponderada 0.5', async () => {
  const { result } = await renderHook(() => useProgresso('c1'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  expect(result.current.data!.cobertura).toBeCloseTo(0.5);
  expect(result.current.data!.coberturaPonderada).toBeCloseTo(0.5);
  expect(result.current.data!.aproveitamentoGeral).toBeNull();
});
