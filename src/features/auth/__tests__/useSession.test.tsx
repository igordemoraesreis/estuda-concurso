import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useSession } from '../useSession';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const listeners: any[] = [];
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jest.fn((cb: any) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }),
        signInWithPassword: jest.fn(() =>
          Promise.resolve({ data: { session: { user: { id: 'u1' } } }, error: null }),
        ),
        signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        __emit: (s: any) => listeners.forEach((l) => l('SIGNED_IN', s)),
      },
    },
  };
});

test('começa sem sessão e loading vira false', async () => {
  const { result } = await renderHook(() => useSession());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.session).toBeNull();
});

test('signInWithPassword chama o supabase', async () => {
  const { result } = await renderHook(() => useSession());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.signInWithPassword('a@b.com', 'senha123'));
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'a@b.com',
    password: 'senha123',
  });
});
