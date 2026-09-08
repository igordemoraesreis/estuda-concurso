import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';

export function useConcursoAtivo() {
  return useQuery({ queryKey: qk.concursoAtivo(), queryFn: api.buscarConcursoAtivo });
}
export function useConcursos() {
  return useQuery({ queryKey: qk.concursos(), queryFn: api.listarConcursos });
}
export function useCriarConcurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.criarConcursoComArvore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo() });
    },
  });
}
export function useArquivarConcurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.arquivarConcurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo() });
      qc.invalidateQueries({ queryKey: qk.concursos() });
    },
  });
}
export function useDefinirConcursoAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.definirConcursoAtivo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo() });
    },
  });
}
