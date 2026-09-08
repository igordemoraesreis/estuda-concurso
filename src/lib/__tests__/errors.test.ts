import { normalizeError } from '../errors';

test('erro de credencial vira código auth em PT-BR', () => {
  const r = normalizeError({ name: 'AuthApiError', message: 'Invalid login credentials', status: 400 });
  expect(r.code).toBe('auth');
  expect(r.message).toMatch(/e-mail ou senha/i);
});

test('violação de RLS vira permissao', () => {
  const r = normalizeError({ code: '42501', message: 'new row violates row-level security policy' });
  expect(r.code).toBe('permissao');
});

test('erro de rede vira rede', () => {
  const r = normalizeError(new TypeError('Network request failed'));
  expect(r.code).toBe('rede');
});

test('desconhecido tem mensagem genérica', () => {
  const r = normalizeError({});
  expect(r.code).toBe('desconhecido');
  expect(r.message.length).toBeGreaterThan(0);
});
