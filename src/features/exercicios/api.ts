import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';
import type { SessaoExercicioInput } from './schema';

export type SessaoExercicioRow = {
  id: string;
  data: string;
  acertos: number;
  erros: number;
  nota: string | null;
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function listarSessoesExercicio(topicoId: string): Promise<SessaoExercicioRow[]> {
  const { data, error } = await supabase
    .from('sessoes_exercicio')
    .select('id, data, acertos, erros, nota')
    .eq('topico_id', topicoId)
    .order('data', { ascending: false });
  if (error) throw normalizeError(error);
  return (data as SessaoExercicioRow[] | null) ?? [];
}

export async function addSessaoExercicio(topicoId: string, input: SessaoExercicioInput) {
  const { error } = await supabase.from('sessoes_exercicio').insert({
    user_id: await uid(),
    topico_id: topicoId,
    data: input.data,
    acertos: input.acertos,
    erros: input.erros,
    nota: input.nota ?? null,
  });
  if (error) throw normalizeError(error);
}

export async function deleteSessaoExercicio(id: string) {
  const { error } = await supabase.from('sessoes_exercicio').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
