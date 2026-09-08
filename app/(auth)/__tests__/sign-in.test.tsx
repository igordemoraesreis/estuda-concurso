import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
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
  fireEvent.changeText(screen.getByLabelText('E-mail'), 'a@b.com');
  fireEvent.changeText(screen.getByLabelText('Senha'), 'errada');
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  });
  await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeOnTheScreen());
});
