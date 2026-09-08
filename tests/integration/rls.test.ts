import { makeUser } from './helpers';

test('usuário não lê concurso de outro usuário', async () => {
  const a = await makeUser(`a${Date.now()}@x.com`);
  const b = await makeUser(`b${Date.now()}@x.com`);
  await a.client.from('concursos').insert({ user_id: a.id, nome: 'Da A', status: 'ativo' });
  const { data } = await b.client.from('concursos').select('*');
  expect(data).toEqual([]);
});

test('usuário não insere linha com user_id de outro', async () => {
  const a = await makeUser(`c${Date.now()}@x.com`);
  const b = await makeUser(`d${Date.now()}@x.com`);
  const { error } = await b.client.from('concursos').insert({ user_id: a.id, nome: 'X', status: 'ativo' });
  expect(error).not.toBeNull();
});
