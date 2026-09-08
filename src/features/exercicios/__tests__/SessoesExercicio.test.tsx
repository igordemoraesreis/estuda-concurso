import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SessoesExercicio } from '../SessoesExercicio';

const mockAdicionar = { mutate: jest.fn(), isPending: false };
jest.mock('../hooks', () => ({
  useSessoesExercicio: () => ({
    data: [{ id: 's1', data: '2026-09-01', acertos: 8, erros: 2, nota: null }],
  }),
  useExercicioMutations: () => ({ adicionar: mockAdicionar, remover: { mutate: jest.fn() } }),
}));

beforeEach(() => {
  mockAdicionar.mutate.mockClear();
});

test('mostra a taxa da sessão existente', async () => {
  await render(
    <ThemeProvider>
      <SessoesExercicio topicoId="t1" concursoId="c1" />
    </ThemeProvider>,
  );
  expect(screen.getByText(/80%/)).toBeOnTheScreen();
});

test('valida total zero antes de salvar', async () => {
  await render(
    <ThemeProvider>
      <SessoesExercicio topicoId="t1" concursoId="c1" />
    </ThemeProvider>,
  );
  fireEvent.press(screen.getByText('Registrar exercícios'));
  await waitFor(() =>
    expect(screen.getByText('Informe ao menos uma questão')).toBeOnTheScreen(),
  );
  expect(mockAdicionar.mutate).not.toHaveBeenCalled();
});
