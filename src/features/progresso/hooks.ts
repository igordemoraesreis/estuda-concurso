import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';
import { carregarArvore } from '@/features/edital/api';
import { coberturaEdital, coberturaPonderada, aproveitamento, tempoEstudado } from './metrics';
import type {
  TopicoLite,
  DisciplinaLite,
  SessaoEstudoLite,
  SessaoExercicioLite,
} from '@/types/models';

export type LinhaDisciplina = {
  id: string;
  nome: string;
  peso: number;
  cobertura: number;
  aproveitamento: number | null;
  tempoSegundos: number;
};
export type PainelDados = {
  cobertura: number;
  coberturaPonderada: number;
  aproveitamentoGeral: number | null;
  tempoTotalSegundos: number;
  tempo7diasSegundos: number;
  disciplinas: LinhaDisciplina[];
};

export function useProgresso(concursoId: string | null) {
  return useQuery({
    queryKey: concursoId ? qk.progresso(concursoId) : ['progresso', 'none'],
    enabled: !!concursoId,
    queryFn: async (): Promise<PainelDados> => {
      const arvore = await carregarArvore(concursoId!);

      const disciplinas: DisciplinaLite[] = arvore.disciplinas.map((d) => ({
        id: d.id,
        nome: d.nome,
        peso: d.peso,
      }));
      const topicos: TopicoLite[] = [];
      for (const d of arvore.disciplinas) {
        for (const t of d.topicos)
          topicos.push({ id: t.id, disciplinaId: d.id, concluido: t.concluido });
        for (const a of d.assuntos)
          for (const t of a.topicos)
            topicos.push({ id: t.id, disciplinaId: d.id, concluido: t.concluido });
      }
      const topicoIds = topicos.map((t) => t.id);

      const [{ data: se, error: e1 }, { data: sx, error: e2 }] = await Promise.all([
        topicoIds.length
          ? supabase
              .from('sessoes_estudo')
              .select('topico_id, duracao_segundos, iniciada_em')
              .in('topico_id', topicoIds)
          : Promise.resolve({ data: [], error: null }),
        topicoIds.length
          ? supabase
              .from('sessoes_exercicio')
              .select('topico_id, acertos, erros, data')
              .in('topico_id', topicoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (e1 || e2) throw normalizeError(e1 ?? e2);

      const sessoesEstudo: SessaoEstudoLite[] = (se ?? []).map((s) => ({
        topicoId: s.topico_id,
        duracaoSegundos: s.duracao_segundos,
        iniciadaEm: s.iniciada_em,
      }));
      const sessoesExercicio: SessaoExercicioLite[] = (sx ?? []).map((s) => ({
        topicoId: s.topico_id,
        acertos: s.acertos,
        erros: s.erros,
        data: s.data,
      }));

      const cob = coberturaEdital(topicos);
      const apr = aproveitamento(sessoesExercicio, topicos);
      const tmp = tempoEstudado(sessoesEstudo, topicos);

      return {
        cobertura: cob.geral,
        coberturaPonderada: coberturaPonderada(disciplinas, topicos),
        aproveitamentoGeral: apr.geral,
        tempoTotalSegundos: tmp.totalSegundos,
        tempo7diasSegundos: tmp.ultimos7diasSegundos,
        disciplinas: arvore.disciplinas.map((d) => ({
          id: d.id,
          nome: d.nome,
          peso: d.peso,
          cobertura: cob.porDisciplina.get(d.id) ?? 0,
          aproveitamento: apr.porDisciplina.get(d.id) ?? null,
          tempoSegundos: tmp.porDisciplina.get(d.id) ?? 0,
        })),
      };
    },
  });
}
