import { makeUser } from './helpers';

test('apagar concurso apaga disciplinas, tópicos e sessões', async () => {
  const u = await makeUser(`cas${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();
  await u.client.from('sessoes_estudo').insert({ user_id: u.id, topico_id: t.id, iniciada_em: new Date().toISOString(), duracao_segundos: 60, origem: 'manual' });

  await u.client.from('concursos').delete().eq('id', c.id);

  const { data: rest } = await u.client.from('sessoes_estudo').select('*').eq('topico_id', t.id);
  expect(rest).toEqual([]);
});
