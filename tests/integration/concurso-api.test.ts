import { makeUser } from './helpers';

test('criar concurso com árvore seta active_concurso_id e cria tópicos', async () => {
  const u = await makeUser(`capi${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'TRT', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'Português', peso: 4, ordem: 0 }).select().single();
  await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'Crase', ordem: 0 });
  await u.client.from('profiles').update({ active_concurso_id: c.id }).eq('id', u.id);

  const { data: prof } = await u.client.from('profiles').select('active_concurso_id').eq('id', u.id).single();
  expect(prof!.active_concurso_id).toBe(c.id);

  const { data: tops } = await u.client.from('topicos').select('nome').eq('disciplina_id', d.id);
  expect(tops!.map((t: any) => t.nome)).toEqual(['Crase']);
});

test('arquivar concurso ativo limpa active_concurso_id', async () => {
  const u = await makeUser(`carq${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'X', status: 'ativo' }).select().single();
  await u.client.from('profiles').update({ active_concurso_id: c.id }).eq('id', u.id);
  await u.client.from('concursos').update({ status: 'arquivado', archived_at: new Date().toISOString() }).eq('id', c.id);
  await u.client.from('profiles').update({ active_concurso_id: null }).eq('id', u.id);
  const { data: prof } = await u.client.from('profiles').select('active_concurso_id').eq('id', u.id).single();
  expect(prof!.active_concurso_id).toBeNull();
});
