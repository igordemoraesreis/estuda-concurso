import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { useSession } from '@/features/auth/useSession';
import * as api from './api';

/** Id do usuário logado; as chaves de concurso/profile são escopadas por ele. */
function useUserId(): string | null {
  const { session } = useSession();
  return session?.user.id ?? null;
}

export function useConcursoAtivo() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.concursoAtivo(userId),
    enabled: !!userId,
    queryFn: api.buscarConcursoAtivo,
  });
}
export function useConcursos() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.concursos(userId),
    enabled: !!userId,
    queryFn: api.listarConcursos,
  });
}
export function useCriarConcurso() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: api.criarConcursoComArvore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile(userId) });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo(userId) });
      qc.invalidateQueries({ queryKey: qk.concursos(userId) });
    },
  });
}
export function useArquivarConcurso() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: api.arquivarConcurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile(userId) });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo(userId) });
      qc.invalidateQueries({ queryKey: qk.concursos(userId) });
    },
  });
}
export function useDefinirConcursoAtivo() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: api.definirConcursoAtivo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile(userId) });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo(userId) });
    },
  });
}
