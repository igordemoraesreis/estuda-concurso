import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export const qk = {
  profile: () => ['profile'] as const,
  concursoAtivo: () => ['concurso', 'ativo'] as const,
  concursos: () => ['concurso', 'lista'] as const,
  arvore: (concursoId: string) => ['arvore', concursoId] as const,
  sessoesEstudo: (topicoId: string) => ['sessoes-estudo', topicoId] as const,
  sessoesExercicio: (topicoId: string) => ['sessoes-exercicio', topicoId] as const,
  progresso: (concursoId: string) => ['progresso', concursoId] as const,
  revisao: (concursoId: string) => ['revisao', concursoId] as const,
};
