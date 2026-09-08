export type AppErrorCode = 'auth' | 'rede' | 'validacao' | 'permissao' | 'desconhecido';

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export function normalizeError(e: unknown): AppError {
  const any = e as Record<string, unknown> | null;
  const raw = String(any?.message ?? '');

  if (e instanceof TypeError && /network|fetch/i.test(raw)) {
    return { code: 'rede', message: 'Sem conexão. Verifique a internet e tente de novo.', cause: e };
  }
  if (any?.code === '42501' || /row-level security/i.test(raw)) {
    return { code: 'permissao', message: 'Você não tem permissão para essa ação.', cause: e };
  }
  if (/invalid login credentials/i.test(raw)) {
    return { code: 'auth', message: 'E-mail ou senha incorretos.', cause: e };
  }
  if (/user already registered/i.test(raw)) {
    return { code: 'auth', message: 'Já existe uma conta com esse e-mail.', cause: e };
  }
  if (/password should be at least/i.test(raw)) {
    return { code: 'auth', message: 'A senha precisa ter pelo menos 6 caracteres.', cause: e };
  }
  if (String(any?.name ?? '').startsWith('Auth')) {
    return { code: 'auth', message: 'Não foi possível autenticar. Tente novamente.', cause: e };
  }
  return { code: 'desconhecido', message: 'Algo deu errado. Tente novamente.', cause: e };
}
