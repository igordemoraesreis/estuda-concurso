import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';

export function useArvore(concursoId: string | null) {
  return useQuery({
    queryKey: concursoId ? qk.arvore(concursoId) : ['arvore', 'none'],
    enabled: !!concursoId,
    queryFn: () => api.carregarArvore(concursoId!),
  });
}

function useInvalidar(concursoId: string | null) {
  const qc = useQueryClient();
  return () => {
    if (!concursoId) return;
    qc.invalidateQueries({ queryKey: qk.arvore(concursoId) });
    qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
    qc.invalidateQueries({ queryKey: qk.revisao(concursoId) });
  };
}

export function useEditalMutations(concursoId: string | null) {
  const inval = useInvalidar(concursoId);

  const addDisciplina = useMutation({
    mutationFn: (v: { nome: string; ordem: number }) =>
      api.addDisciplina(concursoId!, v.nome, v.ordem),
    onSuccess: inval,
  });
  const updateDisciplina = useMutation({
    mutationFn: (v: { id: string; patch: { nome?: string; peso?: number } }) =>
      api.updateDisciplina(v.id, v.patch),
    onSuccess: inval,
  });
  const deleteDisciplina = useMutation({
    mutationFn: (v: { id: string }) => api.deleteDisciplina(v.id),
    onSuccess: inval,
  });

  const addAssunto = useMutation({
    mutationFn: (v: { disciplinaId: string; nome: string; ordem: number }) =>
      api.addAssunto(v.disciplinaId, v.nome, v.ordem),
    onSuccess: inval,
  });
  const updateAssunto = useMutation({
    mutationFn: (v: { id: string; nome: string }) => api.updateAssunto(v.id, v.nome),
    onSuccess: inval,
  });
  const deleteAssunto = useMutation({
    mutationFn: (v: { id: string }) => api.deleteAssunto(v.id),
    onSuccess: inval,
  });

  const addTopico = useMutation({
    mutationFn: (v: {
      disciplinaId: string;
      nome: string;
      ordem: number;
      assuntoId: string | null;
    }) => api.addTopico(v.disciplinaId, v.nome, v.ordem, v.assuntoId),
    onSuccess: inval,
  });
  const updateTopico = useMutation({
    mutationFn: (v: { id: string; patch: { nome?: string } }) => api.updateTopico(v.id, v.patch),
    onSuccess: inval,
  });
  const deleteTopico = useMutation({
    mutationFn: (v: { id: string }) => api.deleteTopico(v.id),
    onSuccess: inval,
  });

  return {
    addDisciplina,
    updateDisciplina,
    deleteDisciplina,
    addAssunto,
    updateAssunto,
    deleteAssunto,
    addTopico,
    updateTopico,
    deleteTopico,
  };
}
