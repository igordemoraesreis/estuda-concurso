import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { useToggleConcluido } from '../useTopico';

const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ update: mockUpdate }) } }));

beforeEach(() => {
  mockEq.mockReset();
  mockUpdate.mockClear();
});

function setup() {
  const qc = new QueryClient();
  qc.setQueryData(qk.arvore('c1'), {
    disciplinas: [
      {
        id: 'd1',
        nome: 'D',
        peso: 3,
        ordem: 0,
        assuntos: [],
        topicos: [
          {
            id: 't1',
            nome: 'T',
            disciplina_id: 'd1',
            assunto_id: null,
            ordem: 0,
            concluido: false,
            concluido_em: null,
          },
        ],
      },
    ],
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

test('marca concluído otimisticamente antes da resposta', async () => {
  let resolver: (v: { error: null }) => void = () => {};
  mockEq.mockReturnValue(
    new Promise<{ error: null }>((res) => {
      resolver = res;
    }),
  );

  const { qc, wrapper } = setup();
  const { result } = await renderHook(() => useToggleConcluido('c1'), { wrapper });

  await act(async () => {
    result.current.mutate({ topicoId: 't1', concluido: true });
  });

  // cache já foi atualizado enquanto a mutação segue pendente
  const arv = qc.getQueryData(qk.arvore('c1')) as {
    disciplinas: { topicos: { concluido: boolean }[] }[];
  };
  expect(arv.disciplinas[0].topicos[0].concluido).toBe(true);
  expect(result.current.isPending).toBe(true);
  expect(mockUpdate).toHaveBeenCalledWith({ concluido: true });

  await act(async () => {
    resolver({ error: null });
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});

test('reverte o cache quando a atualização falha', async () => {
  mockEq.mockResolvedValue({ error: { message: 'falha' } });

  const { qc, wrapper } = setup();
  const { result } = await renderHook(() => useToggleConcluido('c1'), { wrapper });

  await act(async () => {
    result.current.mutate({ topicoId: 't1', concluido: true });
  });
  await waitFor(() => expect(result.current.isError).toBe(true));

  const arv = qc.getQueryData(qk.arvore('c1')) as {
    disciplinas: { topicos: { concluido: boolean; concluido_em: string | null }[] }[];
  };
  expect(arv.disciplinas[0].topicos[0].concluido).toBe(false);
  expect(arv.disciplinas[0].topicos[0].concluido_em).toBeNull();
});

test('patch atinge tópico dentro de assunto também', async () => {
  mockEq.mockResolvedValue({ error: null });

  const qc = new QueryClient();
  qc.setQueryData(qk.arvore('c1'), {
    disciplinas: [
      {
        id: 'd1',
        nome: 'D',
        peso: 3,
        ordem: 0,
        topicos: [],
        assuntos: [
          {
            id: 'a1',
            nome: 'A',
            ordem: 0,
            topicos: [
              {
                id: 't9',
                nome: 'T9',
                disciplina_id: 'd1',
                assunto_id: 'a1',
                ordem: 0,
                concluido: false,
                concluido_em: null,
              },
            ],
          },
        ],
      },
    ],
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useToggleConcluido('c1'), { wrapper });

  await act(async () => {
    result.current.mutate({ topicoId: 't9', concluido: true });
  });

  const arv = qc.getQueryData(qk.arvore('c1')) as {
    disciplinas: { assuntos: { topicos: { concluido: boolean }[] }[] }[];
  };
  expect(arv.disciplinas[0].assuntos[0].topicos[0].concluido).toBe(true);
});

test('sem concursoId não quebra a mutação', async () => {
  mockEq.mockResolvedValue({ error: null });
  const qc = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useToggleConcluido(null), { wrapper });

  await act(async () => {
    result.current.mutate({ topicoId: 't1', concluido: true });
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mockUpdate).toHaveBeenCalledWith({ concluido: true });
});
