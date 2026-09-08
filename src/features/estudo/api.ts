import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

export type SessaoEstudoRow = {
  id: string;
  iniciada_em: string;
  duracao_segundos: number;
  origem: string;
  nota: string | null;
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function salvarSessaoCronometro(input: {
  topicoId: string;
  iniciadaEm: string;
  duracaoSegundos: number;
}) {
  const { error } = await supabase.from('sessoes_estudo').insert({
    user_id: await uid(),
    topico_id: input.topicoId,
    iniciada_em: input.iniciadaEm,
    duracao_segundos: input.duracaoSegundos,
    origem: 'cronometro',
  });
  if (error) throw normalizeError(error);
}

export async function salvarSessaoManual(input: {
  topicoId: string;
  data: string;
  duracaoSegundos: number;
  nota?: string;
}) {
  const { error } = await supabase.from('sessoes_estudo').insert({
    user_id: await uid(),
    topico_id: input.topicoId,
    iniciada_em: `${input.data}T12:00:00Z`,
    duracao_segundos: input.duracaoSegundos,
    origem: 'manual',
    nota: input.nota ?? null,
  });
  if (error) throw normalizeError(error);
}

export async function listarSessoesEstudo(topicoId: string): Promise<SessaoEstudoRow[]> {
  const { data, error } = await supabase
    .from('sessoes_estudo')
    .select('id, iniciada_em, duracao_segundos, origem, nota')
    .eq('topico_id', topicoId)
    .order('iniciada_em', { ascending: false });
  if (error) throw normalizeError(error);
  return (data as SessaoEstudoRow[] | null) ?? [];
}
