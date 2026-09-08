import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';

export type ItemRevisao = {
  topicoId: string;
  nome: string;
  disciplinaNome: string;
  concluidoEm: string;
  diasDesde: number;
};
export type GrupoRevisao = { limiarDias: number; itens: ItemRevisao[] };

export function diasEntre(iso: string, agora: Date): number {
  return Math.floor((agora.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export function agruparRevisao(
  topicos: { topicoId: string; nome: string; disciplinaNome: string; concluidoEm: string }[],
  limiares: number[],
  agora: Date,
): GrupoRevisao[] {
  const ordenados = [...limiares].sort((a, b) => b - a); // maior primeiro
  const buckets = new Map<number, ItemRevisao[]>();
  for (const t of topicos) {
    const dias = diasEntre(t.concluidoEm, agora);
    const limiar = ordenados.find((l) => l <= dias);
    if (limiar === undefined) continue;
    const item: ItemRevisao = { ...t, diasDesde: dias };
    buckets.set(limiar, [...(buckets.get(limiar) ?? []), item]);
  }
  return ordenados
    .filter((l) => buckets.has(l))
    .map((l) => ({
      limiarDias: l,
      itens: buckets.get(l)!.sort((a, b) => b.diasDesde - a.diasDesde),
    }));
}

export function useRevisao(concursoId: string | null, limiares: number[]) {
  return useQuery({
    queryKey: concursoId ? [...qk.revisao(concursoId), limiares.join(',')] : ['revisao', 'none'],
    enabled: !!concursoId,
    queryFn: async (): Promise<GrupoRevisao[]> => {
      const { data: disc, error: e1 } = await supabase
        .from('disciplinas')
        .select('id, nome')
        .eq('concurso_id', concursoId!);
      if (e1) throw normalizeError(e1);
      const nomeDisc = new Map((disc ?? []).map((d) => [d.id, d.nome]));

      const { data: tops, error: e2 } = await supabase
        .from('topicos')
        .select('id, nome, disciplina_id, concluido, concluido_em')
        .in(
          'disciplina_id',
          (disc ?? []).map((d) => d.id),
        )
        .eq('concluido', true)
        .not('concluido_em', 'is', null);
      if (e2) throw normalizeError(e2);

      return agruparRevisao(
        (tops ?? []).map((t) => ({
          topicoId: t.id,
          nome: t.nome,
          disciplinaNome: nomeDisc.get(t.disciplina_id) ?? '',
          concluidoEm: t.concluido_em as string,
        })),
        limiares,
        new Date(),
      );
    },
  });
}
