import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';
import type { SessaoExercicioInput } from './schema';

export function useSessoesExercicio(topicoId: string) {
  return useQuery({
    queryKey: qk.sessoesExercicio(topicoId),
    queryFn: () => api.listarSessoesExercicio(topicoId),
  });
}

export function useExercicioMutations(concursoId: string | null, topicoId: string) {
  const qc = useQueryClient();
  const inval = () => {
    qc.invalidateQueries({ queryKey: qk.sessoesExercicio(topicoId) });
    if (concursoId) qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
  };
  return {
    adicionar: useMutation({
      mutationFn: (input: SessaoExercicioInput) => api.addSessaoExercicio(topicoId, input),
      onSuccess: inval,
    }),
    remover: useMutation({ mutationFn: api.deleteSessaoExercicio, onSuccess: inval }),
  };
}
