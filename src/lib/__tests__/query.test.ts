import { supabase } from '@/lib/supabase';
import { qk, queryClient, installAuthCacheReset, __resetAuthCacheResetState } from '../query';

const onAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;

type Ouvinte = (evento: string, sessao: { user: { id: string } } | null) => void;

function instalarECapturar(): { emitir: Ouvinte; parar: () => void } {
  const parar = installAuthCacheReset();
  const emitir = onAuthStateChange.mock.calls.at(-1)![0] as Ouvinte;
  return { emitir, parar };
}

// Sem o clear, os timers de garbage collection do query-core seguram o worker do Jest.
afterEach(() => queryClient.clear());

beforeEach(() => {
  queryClient.clear();
  __resetAuthCacheResetState();
  onAuthStateChange.mockClear();
});

test('chaves de identidade são escopadas por usuário', () => {
  expect(qk.profile('u1')).toEqual(['profile', 'u1']);
  expect(qk.concursoAtivo('u1')).toEqual(['concurso', 'ativo', 'u1']);
  expect(qk.concursos('u1')).toEqual(['concurso', 'lista', 'u1']);
  // Chaves de usuários diferentes nunca colidem.
  expect(qk.profile('u1')).not.toEqual(qk.profile('u2'));
});

test('SIGNED_OUT limpa o cache', () => {
  queryClient.setQueryData(qk.profile('u1'), { id: 'u1', display_name: 'Ana' });
  const { emitir, parar } = instalarECapturar();

  emitir('SIGNED_OUT', null);

  expect(queryClient.getQueryData(qk.profile('u1'))).toBeUndefined();
  parar();
});

test('troca de usuário limpa o cache; o usuário B não vê os dados do A', () => {
  const { emitir, parar } = instalarECapturar();

  emitir('SIGNED_IN', { user: { id: 'u1' } });
  queryClient.setQueryData(qk.profile('u1'), { id: 'u1', display_name: 'Ana' });
  queryClient.setQueryData(qk.concursoAtivo('u1'), { id: 'c1', nome: 'TRT-4' });

  emitir('SIGNED_IN', { user: { id: 'u2' } });

  expect(queryClient.getQueryData(qk.profile('u1'))).toBeUndefined();
  expect(queryClient.getQueryData(qk.concursoAtivo('u1'))).toBeUndefined();
  expect(queryClient.getQueryData(qk.profile('u2'))).toBeUndefined();
  parar();
});

test('TOKEN_REFRESHED do mesmo usuário não limpa nada', () => {
  const { emitir, parar } = instalarECapturar();

  emitir('SIGNED_IN', { user: { id: 'u1' } });
  queryClient.setQueryData(qk.profile('u1'), { id: 'u1' });

  emitir('TOKEN_REFRESHED', { user: { id: 'u1' } });
  emitir('SIGNED_IN', { user: { id: 'u1' } });

  expect(queryClient.getQueryData(qk.profile('u1'))).toEqual({ id: 'u1' });
  parar();
});

test('installAuthCacheReset devolve o unsubscribe da inscrição', () => {
  const parar = installAuthCacheReset();
  const { subscription } = onAuthStateChange.mock.results.at(-1)!.value.data;
  parar();
  expect(subscription.unsubscribe).toHaveBeenCalled();
});
