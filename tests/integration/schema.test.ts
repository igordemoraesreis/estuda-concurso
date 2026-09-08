import { admin } from './helpers';

test('as tabelas do schema existem', async () => {
  const a = admin();
  for (const t of ['profiles','concursos','disciplinas','assuntos','topicos','sessoes_estudo','sessoes_exercicio']) {
    const { error } = await a.from(t).select('*').limit(0);
    expect(error).toBeNull();
  }
});

test('peso da disciplina rejeita valor fora de 1..5', async () => {
  const a = admin();
  const { data: u } = await a.auth.admin.createUser({ email: `s${Date.now()}@x.com`, password: 'senha-forte-123', email_confirm: true });
  const uid = u.user!.id;
  const { data: c } = await a.from('concursos').insert({ user_id: uid, nome: 'C', status: 'ativo' }).select().single();
  const { error } = await a.from('disciplinas').insert({ user_id: uid, concurso_id: c!.id, nome: 'D', peso: 9, ordem: 0 });
  expect(error).not.toBeNull();
});
