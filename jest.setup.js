jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock global do cliente Supabase: os testes unitários nunca devem abrir socket nem
// depender de um `.env` populado. Testes que precisam de comportamento específico
// declaram o próprio `jest.mock('@/lib/supabase', ...)` (que sobrepõe este) ou usam
// `jest.unmock` para o cliente real.
jest.mock('@/lib/supabase', () => {
  // Builder encadeável: qualquer método devolve o próprio proxy e o proxy é "thenable",
  // então `.from(x).select(y).eq(a, b).maybeSingle()` resolve para `{ data: null, error: null }`.
  const criarChain = () => {
    const resultado = { data: null, error: null };
    const proxy = new Proxy(
      {},
      {
        get(_alvo, prop) {
          if (prop === 'then') return (onFulfilled) => Promise.resolve(resultado).then(onFulfilled);
          if (prop === 'catch') return (onRejected) => Promise.resolve(resultado).catch(onRejected);
          if (prop === 'finally') return (fn) => Promise.resolve(resultado).finally(fn);
          if (typeof prop === 'symbol') return undefined;
          return () => proxy;
        },
      },
    );
    return proxy;
  };

  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
        getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        signInWithOAuth: jest.fn(() => Promise.resolve({ data: { url: '' }, error: null })),
        exchangeCodeForSession: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      },
      from: jest.fn(() => criarChain()),
    },
  };
});
