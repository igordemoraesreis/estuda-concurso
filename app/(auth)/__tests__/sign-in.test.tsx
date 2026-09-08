import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { ToastProvider } from '@/components/ui';
import SignIn from '../sign-in';

const mockSignInWithPassword = jest.fn(() =>
  Promise.reject({ message: 'E-mail ou senha incorretos.' }),
);
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ signInWithPassword: mockSignInWithPassword, signInWithGoogle: jest.fn() }),
}));
jest.mock('expo-router', () => ({ Link: ({ children }: any) => children }));

test('mostra erro de credencial inválida', async () => {
  await render(
    <ThemeProvider>
      <ToastProvider>
        <SignIn />
      </ToastProvider>
    </ThemeProvider>,
  );
  // RNTL v14: fireEvent devolve Promise; sem o await sobra um act() aberto que
  // corrompe o próximo teste ("overlapping act() calls").
  await fireEvent.changeText(screen.getByLabelText('E-mail'), 'a@b.com');
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'errada');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeOnTheScreen());
});

test('o título usa cor do tema (legível no modo escuro)', async () => {
  await render(
    <ThemeProvider>
      <ToastProvider>
        <SignIn />
      </ToastProvider>
    </ThemeProvider>,
  );
  // "Entrar" aparece 2x: o título (primeiro na árvore) e o rótulo do botão.
  const titulo = screen.getAllByText('Entrar')[0];
  expect(titulo).toHaveStyle({ color: tokens.colors.text.light });
  expect(screen.getByText('Não tem conta? Cadastre-se')).toHaveStyle({
    color: tokens.colors.muted.light,
  });
});
