import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

export type TopicoRow = {
  id: string;
  nome: string;
  disciplina_id: string;
  assunto_id: string | null;
  ordem: number;
  concluido: boolean;
  concluido_em: string | null;
};
export type AssuntoRow = { id: string; nome: string; ordem: number; topicos: TopicoRow[] };
export type DisciplinaRow = {
  id: string;
  nome: string;
  peso: number;
  ordem: number;
  assuntos: AssuntoRow[];
  topicos: TopicoRow[];
};
export type ArvoreCarregada = { disciplinas: DisciplinaRow[] };

export async function carregarArvore(concursoId: string): Promise<ArvoreCarregada> {
  const { data: disc, error: e1 } = await supabase
    .from('disciplinas')
    .select('id, nome, peso, ordem')
    .eq('concurso_id', concursoId)
    .order('ordem');
  if (e1) throw normalizeError(e1);

  const discIds = (disc ?? []).map((d) => d.id);
  if (discIds.length === 0) return { disciplinas: [] };

  // Escopado por disciplina: sem o `.in(...)` isso puxaria TODAS as linhas do usuário,
  // em todos os concursos, e o PostgREST corta em 1000 linhas (truncamento silencioso).
  const [{ data: ass, error: e2 }, { data: tops, error: e3 }] = await Promise.all([
    supabase
      .from('assuntos')
      .select('id, nome, ordem, disciplina_id')
      .in('disciplina_id', discIds)
      .order('ordem'),
    supabase
      .from('topicos')
      .select('id, nome, disciplina_id, assunto_id, ordem, concluido, concluido_em')
      .in('disciplina_id', discIds)
      .order('ordem'),
  ]);
  if (e2 || e3) throw normalizeError(e2 ?? e3);

  const disciplinas: DisciplinaRow[] = (disc ?? []).map((d) => {
    const assuntos: AssuntoRow[] = (ass ?? [])
      .filter((a) => a.disciplina_id === d.id)
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        ordem: a.ordem,
        topicos: (tops ?? []).filter((t) => t.assunto_id === a.id) as TopicoRow[],
      }));
    const topicos = (tops ?? []).filter(
      (t) => t.disciplina_id === d.id && t.assunto_id === null,
    ) as TopicoRow[];
    return { id: d.id, nome: d.nome, peso: d.peso, ordem: d.ordem, assuntos, topicos };
  });
  return { disciplinas };
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function addDisciplina(concursoId: string, nome: string, ordem: number) {
  const { error } = await supabase
    .from('disciplinas')
    .insert({ user_id: await uid(), concurso_id: concursoId, nome, peso: 3, ordem });
  if (error) throw normalizeError(error);
}
export async function updateDisciplina(id: string, patch: { nome?: string; peso?: number }) {
  const { error } = await supabase.from('disciplinas').update(patch).eq('id', id);
  if (error) throw normalizeError(error);
}
export async function deleteDisciplina(id: string) {
  const { error } = await supabase.from('disciplinas').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
export async function addAssunto(disciplinaId: string, nome: string, ordem: number) {
  const { error } = await supabase
    .from('assuntos')
    .insert({ user_id: await uid(), disciplina_id: disciplinaId, nome, ordem });
  if (error) throw normalizeError(error);
}
export async function updateAssunto(id: string, nome: string) {
  const { error } = await supabase.from('assuntos').update({ nome }).eq('id', id);
  if (error) throw normalizeError(error);
}
export async function deleteAssunto(id: string) {
  const { error } = await supabase.from('assuntos').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
export async function addTopico(
  disciplinaId: string,
  nome: string,
  ordem: number,
  assuntoId: string | null,
) {
  const { error } = await supabase
    .from('topicos')
    .insert({ user_id: await uid(), disciplina_id: disciplinaId, assunto_id: assuntoId, nome, ordem });
  if (error) throw normalizeError(error);
}
export async function updateTopico(id: string, patch: { nome?: string }) {
  const { error } = await supabase.from('topicos').update(patch).eq('id', id);
  if (error) throw normalizeError(error);
}
export async function deleteTopico(id: string) {
  const { error } = await supabase.from('topicos').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
