import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import NovoConcurso from '../novo-concurso';

const mockMutateAsync = jest.fn((_input: { concurso: { nome: string } }) =>
  Promise.resolve({ concursoId: 'c1' }),
);
jest.mock('@/features/concurso/hooks', () => ({
  useCriarConcurso: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const wrap = () =>
  render(
    <ThemeProvider>
      <ToastProvider>
        <NovoConcurso />
      </ToastProvider>
    </ThemeProvider>,
  );

beforeEach(() => {
  mockMutateAsync.mockClear();
  mockReplace.mockClear();
});

test('bloqueia avanço sem nome do concurso', async () => {
  await wrap();
  fireEvent.press(screen.getByText('Continuar'));
  await waitFor(() =>
    expect(screen.getByText('Informe o nome do concurso')).toBeOnTheScreen(),
  );
});

test('fluxo completo cria concurso a partir de texto colado', async () => {
  await wrap();
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Nome do concurso'), 'TRT-4');
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Continuar'));
  });
  await waitFor(() => expect(screen.getByLabelText('Texto do edital')).toBeOnTheScreen());
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Texto do edital'), '1 PORTUGUÊS\n1.1 Crase');
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Processar texto'));
  });
  await waitFor(() => expect(screen.getByText('Criar concurso')).toBeOnTheScreen());
  await act(async () => {
    fireEvent.press(screen.getByText('Criar concurso'));
  });
  await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
  expect(mockMutateAsync.mock.calls[0][0].concurso.nome).toBe('TRT-4');
  expect(mockReplace).toHaveBeenCalledWith('/(app)');
});
