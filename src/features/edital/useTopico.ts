import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';
import type { ArvoreCarregada, TopicoRow } from './api';

export function useTopico(topicoId: string) {
  return useQuery({
    queryKey: ['topico', topicoId],
    enabled: !!topicoId,
    queryFn: async (): Promise<TopicoRow | null> => {
      const { data, error } = await supabase
        .from('topicos')
        .select('id, nome, disciplina_id, assunto_id, ordem, concluido, concluido_em')
        .eq('id', topicoId)
        .maybeSingle();
      if (error) throw normalizeError(error);
      return (data as TopicoRow | null) ?? null;
    },
  });
}

function aplicar(arv: ArvoreCarregada, topicoId: string, concluido: boolean): ArvoreCarregada {
  const patch = (t: TopicoRow): TopicoRow =>
    t.id === topicoId
      ? { ...t, concluido, concluido_em: concluido ? new Date().toISOString() : null }
      : t;
  return {
    disciplinas: arv.disciplinas.map((d) => ({
      ...d,
      topicos: d.topicos.map(patch),
      assuntos: d.assuntos.map((a) => ({ ...a, topicos: a.topicos.map(patch) })),
    })),
  };
}

type ToggleInput = { topicoId: string; concluido: boolean };
type ToggleContext = { anterior?: ArvoreCarregada };

export function useToggleConcluido(concursoId: string | null) {
  const qc = useQueryClient();
  return useMutation<void, unknown, ToggleInput, ToggleContext>({
    mutationFn: async ({ topicoId, concluido }) => {
      const { error } = await supabase.from('topicos').update({ concluido }).eq('id', topicoId);
      if (error) throw normalizeError(error);
    },
    onMutate: async ({ topicoId, concluido }) => {
      if (!concursoId) return {};
      await qc.cancelQueries({ queryKey: qk.arvore(concursoId) });
      const anterior = qc.getQueryData<ArvoreCarregada>(qk.arvore(concursoId));
      if (anterior) {
        qc.setQueryData(qk.arvore(concursoId), aplicar(anterior, topicoId, concluido));
      }
      return { anterior };
    },
    onError: (_e, _v, ctx) => {
      if (concursoId && ctx?.anterior) {
        qc.setQueryData(qk.arvore(concursoId), ctx.anterior);
      }
    },
    onSettled: (_d, _e, { topicoId }) => {
      qc.invalidateQueries({ queryKey: ['topico', topicoId] });
      if (!concursoId) return;
      qc.invalidateQueries({ queryKey: qk.arvore(concursoId) });
      qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
      qc.invalidateQueries({ queryKey: qk.revisao(concursoId) });
    },
  });
}
