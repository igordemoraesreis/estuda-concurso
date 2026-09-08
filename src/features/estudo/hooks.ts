import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';

export function useSessoesEstudo(topicoId: string) {
  return useQuery({
    queryKey: qk.sessoesEstudo(topicoId),
    queryFn: () => api.listarSessoesEstudo(topicoId),
  });
}

export function useEstudoMutations(concursoId: string | null, topicoId: string) {
  const qc = useQueryClient();
  const inval = () => {
    qc.invalidateQueries({ queryKey: qk.sessoesEstudo(topicoId) });
    if (concursoId) qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
  };
  return {
    salvarCronometro: useMutation({ mutationFn: api.salvarSessaoCronometro, onSuccess: inval }),
    salvarManual: useMutation({ mutationFn: api.salvarSessaoManual, onSuccess: inval }),
  };
}
