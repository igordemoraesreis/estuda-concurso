import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SessoesEstudo } from '../SessoesEstudo';
import { useTimer } from '../timerStore';

const mockSalvarCronometro = { mutate: jest.fn() };
jest.mock('../hooks', () => ({
  useSessoesEstudo: () => ({ data: [] }),
  useEstudoMutations: () => ({
    salvarCronometro: mockSalvarCronometro,
    salvarManual: { mutate: jest.fn() },
  }),
}));

beforeEach(() => {
  mockSalvarCronometro.mutate.mockClear();
  useTimer.getState().reset();
});

test('parar o cronômetro salva a sessão e reseta', async () => {
  useTimer.setState({
    topicoId: 't1',
    topicoNome: 'T',
    status: 'running',
    iniciadaEm: Date.now() - 60000,
    acumulado: 0,
  });
  await render(
    <ThemeProvider>
      <SessoesEstudo topicoId="t1" concursoId="c1" />
    </ThemeProvider>,
  );
  fireEvent.press(screen.getByText('Parar'));
  expect(mockSalvarCronometro.mutate).toHaveBeenCalled();
  expect(useTimer.getState().status).toBe('idle');
});
