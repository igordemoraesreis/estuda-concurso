import { makeUser } from './helpers';

async function baseTree(u: { id: string; client: any }) {
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  return { c, d };
}

test('concluido_em preenche ao concluir e limpa ao desmarcar', async () => {
  const u = await makeUser(`t${Date.now()}@x.com`);
  const { d } = await baseTree(u);
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();

  await u.client.from('topicos').update({ concluido: true }).eq('id', t.id);
  const { data: r1 } = await u.client.from('topicos').select('concluido_em').eq('id', t.id).single();
  expect(r1!.concluido_em).not.toBeNull();

  await u.client.from('topicos').update({ concluido: false }).eq('id', t.id);
  const { data: r2 } = await u.client.from('topicos').select('concluido_em').eq('id', t.id).single();
  expect(r2!.concluido_em).toBeNull();
});

test('assunto_id de outra disciplina é rejeitado', async () => {
  const u = await makeUser(`t2${Date.now()}@x.com`);
  const { c, d } = await baseTree(u);
  const { data: d2 } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D2', ordem: 1 }).select().single();
  const { data: a2 } = await u.client.from('assuntos').insert({ user_id: u.id, disciplina_id: d2.id, nome: 'A2', ordem: 0 }).select().single();
  const { error } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, assunto_id: a2.id, nome: 'T', ordem: 0 });
  expect(error).not.toBeNull();
});

test('profiles é criado automaticamente no signup', async () => {
  const u = await makeUser(`p${Date.now()}@x.com`);
  const { data } = await u.client.from('profiles').select('id').eq('id', u.id).single();
  expect(data!.id).toBe(u.id);
});
