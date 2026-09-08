import { MutationCache, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

// Ponte para o toast: `ToastProvider` registra a função em um efeito (ver
// `src/components/ui/Toast.tsx`). Antes disso é um no-op, então nada quebra se uma
// mutation falhar durante o boot.
let toastErro: (mensagem: string) => void = () => {};
export function setMutationErrorToast(fn: (mensagem: string) => void) {
  toastErro = fn;
}

export const queryClient = new QueryClient({
  // Feedback padrão de erro para TODAS as mutations. Handlers `onError` por chamada
  // continuam rodando (o TanStack chama o do cache e o da chamada).
  mutationCache: new MutationCache({
    onError: (e) => toastErro(normalizeError(e).message),
  }),
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export const qk = {
  // Chaves de identidade são escopadas por usuário: sem isso o cache vaza entre
  // contas no mesmo aparelho.
  profile: (userId: string | null) => ['profile', userId] as const,
  concursoAtivo: (userId: string | null) => ['concurso', 'ativo', userId] as const,
  concursos: (userId: string | null) => ['concurso', 'lista', userId] as const,
  arvore: (concursoId: string) => ['arvore', concursoId] as const,
  sessoesEstudo: (topicoId: string) => ['sessoes-estudo', topicoId] as const,
  sessoesExercicio: (topicoId: string) => ['sessoes-exercicio', topicoId] as const,
  progresso: (concursoId: string) => ['progresso', concursoId] as const,
  revisao: (concursoId: string) => ['revisao', concursoId] as const,
};

/**
 * Limpa o cache do React Query quando a identidade muda.
 *
 * Decisão: a inscrição vive aqui (módulo `query.ts`) e é instalada uma única vez por
 * `app/_layout.tsx` num efeito, em vez de um listener criado na importação do módulo —
 * assim os testes controlam o ciclo de vida e não há efeito colateral de import.
 *
 * - `SIGNED_OUT` → limpa tudo.
 * - `SIGNED_IN` / `INITIAL_SESSION` com `user.id` diferente do anterior → limpa tudo.
 * - `TOKEN_REFRESHED` e demais eventos (mesmo usuário) → não faz nada.
 */
let ultimoUserId: string | null = null;

export function installAuthCacheReset(): () => void {
  const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
    const novoUserId = sessao?.user?.id ?? null;
    if (evento === 'SIGNED_OUT') {
      ultimoUserId = null;
      queryClient.clear();
      return;
    }
    if (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION') {
      if (novoUserId !== ultimoUserId) {
        // Só limpa se já havia outro usuário; no primeiro login o cache está vazio e
        // limpar cancelaria queries legítimas em voo.
        if (ultimoUserId !== null) queryClient.clear();
        ultimoUserId = novoUserId;
      }
    }
  });
  return () => data.subscription.unsubscribe();
}

/** Apenas para testes: zera a memória do último usuário observado. */
export function __resetAuthCacheResetState() {
  ultimoUserId = null;
}
