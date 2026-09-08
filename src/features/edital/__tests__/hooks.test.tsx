import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useArvore } from '../hooks';

jest.mock('../api', () => ({
  carregarArvore: jest.fn(() =>
    Promise.resolve({
      disciplinas: [
        {
          id: 'd1',
          nome: 'Português',
          peso: 4,
          ordem: 0,
          assuntos: [],
          topicos: [
            {
              id: 't1',
              nome: 'Crase',
              disciplina_id: 'd1',
              assunto_id: null,
              ordem: 0,
              concluido: false,
              concluido_em: null,
            },
          ],
        },
      ],
    }),
  ),
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

test('carrega a árvore do concurso', async () => {
  const { result } = await renderHook(() => useArvore('c1'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  expect(result.current.data!.disciplinas[0].nome).toBe('Português');
});
