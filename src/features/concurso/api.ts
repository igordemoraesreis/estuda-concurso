import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';
import type { ConcursoInput } from './schema';
import type { DisciplinaDraft } from './parseEditalTexto';

export type Concurso = {
  id: string; nome: string; banca: string | null; cargo: string | null;
  data_prova: string | null; status: 'ativo' | 'arquivado';
};

export async function buscarConcursoAtivo(): Promise<Concurso | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: prof } = await supabase.from('profiles').select('active_concurso_id').eq('id', u.user.id).maybeSingle();
  if (!prof?.active_concurso_id) return null;
  const { data, error } = await supabase
    .from('concursos')
    .select('id, nome, banca, cargo, data_prova, status')
    .eq('id', prof.active_concurso_id)
    .maybeSingle();
  if (error) throw normalizeError(error);
  return data as Concurso | null;
}

export async function listarConcursos(): Promise<Concurso[]> {
  const { data, error } = await supabase
    .from('concursos')
    .select('id, nome, banca, cargo, data_prova, status')
    .order('created_at', { ascending: false });
  if (error) throw normalizeError(error);
  return (data ?? []) as Concurso[];
}

export async function criarConcursoComArvore(input: {
  concurso: ConcursoInput; disciplinas: DisciplinaDraft[];
}): Promise<{ concursoId: string }> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;

  const { data: c, error: cErr } = await supabase
    .from('concursos')
    .insert({ user_id: uid, nome: input.concurso.nome, banca: input.concurso.banca ?? null, cargo: input.concurso.cargo ?? null, data_prova: input.concurso.data_prova ?? null, status: 'ativo' })
    .select('id')
    .single();
  if (cErr) throw normalizeError(cErr);

  for (const [di, d] of input.disciplinas.entries()) {
    const { data: disc, error: dErr } = await supabase
      .from('disciplinas')
      .insert({ user_id: uid, concurso_id: c.id, nome: d.nome, peso: d.peso, ordem: di })
      .select('id')
      .single();
    if (dErr) throw normalizeError(dErr);

    for (const [ti, t] of d.topicos.entries()) {
      const { error } = await supabase.from('topicos').insert({ user_id: uid, disciplina_id: disc.id, nome: t.nome, ordem: ti });
      if (error) throw normalizeError(error);
    }
    for (const [ai, a] of d.assuntos.entries()) {
      const { data: ass, error: aErr } = await supabase
        .from('assuntos')
        .insert({ user_id: uid, disciplina_id: disc.id, nome: a.nome, ordem: ai })
        .select('id')
        .single();
      if (aErr) throw normalizeError(aErr);
      for (const [ti, t] of a.topicos.entries()) {
        const { error } = await supabase.from('topicos').insert({ user_id: uid, disciplina_id: disc.id, assunto_id: ass.id, nome: t.nome, ordem: ti });
        if (error) throw normalizeError(error);
      }
    }
  }

  const { error: pErr } = await supabase.from('profiles').update({ active_concurso_id: c.id }).eq('id', uid);
  if (pErr) throw normalizeError(pErr);
  return { concursoId: c.id };
}

export async function arquivarConcurso(id: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;
  const { error } = await supabase.from('concursos').update({ status: 'arquivado', archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw normalizeError(error);
  const { data: prof } = await supabase.from('profiles').select('active_concurso_id').eq('id', uid).maybeSingle();
  if (prof?.active_concurso_id === id) {
    await supabase.from('profiles').update({ active_concurso_id: null }).eq('id', uid);
  }
}

export async function definirConcursoAtivo(id: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('profiles').update({ active_concurso_id: id }).eq('id', u.user!.id);
  if (error) throw normalizeError(error);
}
