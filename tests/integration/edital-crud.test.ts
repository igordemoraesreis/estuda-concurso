import { makeUser } from './helpers';

async function ctx() {
  const u = await makeUser(`ed${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  return { u, c };
}

test('adicionar e apagar disciplina', async () => {
  const { u, c } = await ctx();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', peso: 3, ordem: 0 }).select().single();
  await u.client.from('disciplinas').delete().eq('id', d.id);
  const { data } = await u.client.from('disciplinas').select('*').eq('concurso_id', c.id);
  expect(data).toEqual([]);
});

test('apagar assunto desagrupa tópicos (assunto_id vira null)', async () => {
  const { u, c } = await ctx();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', peso: 3, ordem: 0 }).select().single();
  const { data: a } = await u.client.from('assuntos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'A', ordem: 0 }).select().single();
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, assunto_id: a.id, nome: 'T', ordem: 0 }).select().single();
  await u.client.from('assuntos').delete().eq('id', a.id);
  const { data: r } = await u.client.from('topicos').select('assunto_id').eq('id', t.id).single();
  expect(r!.assunto_id).toBeNull();
});
