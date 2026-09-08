import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
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

const renderTela = () =>
  render(
    <ThemeProvider>
      <ToastProvider>
        <SessoesEstudo topicoId="t1" concursoId="c1" />
      </ToastProvider>
    </ThemeProvider>,
  );

beforeEach(() => {
  mockSalvarCronometro.mutate.mockReset();
  useTimer.getState().reset();
});

test('parar o cronômetro salva a sessão e só reseta no onSuccess', async () => {
  const inicio = Date.now() - 60_000;
  useTimer.setState({
    topicoId: 't1',
    topicoNome: 'T',
    status: 'running',
    iniciadaEm: inicio,
    sessaoIniciadaEm: inicio,
    acumulado: 0,
  });
  await renderTela();
  await fireEvent.press(screen.getByText('Parar'));
  expect(mockSalvarCronometro.mutate).toHaveBeenCalled();
  // Ainda não resetou: a mutation não resolveu.
  expect(useTimer.getState().status).toBe('running');

  const [, opcoes] = mockSalvarCronometro.mutate.mock.calls[0];
  await act(async () => opcoes.onSuccess());
  expect(useTimer.getState().status).toBe('idle');
});

test('erro ao salvar mantém a sessão viva (não perde o tempo)', async () => {
  const inicio = Date.now() - 60_000;
  useTimer.setState({
    topicoId: 't1',
    topicoNome: 'T',
    status: 'running',
    iniciadaEm: inicio,
    sessaoIniciadaEm: inicio,
    acumulado: 0,
  });
  await renderTela();
  await fireEvent.press(screen.getByText('Parar'));
  const [, opcoes] = mockSalvarCronometro.mutate.mock.calls[0];
  // O toast de erro é responsabilidade do MutationCache (ver mutationToast.test.tsx);
  // aqui o que importa é que a sessão não é descartada.
  await act(async () => opcoes.onSettled());
  expect(useTimer.getState().status).toBe('running');
  expect(useTimer.getState().acumulado).toBe(0);
  expect(screen.getByText('Parar')).toBeOnTheScreen();
});

test('usa sessaoIniciadaEm (e não o horário da parada) após uma pausa', async () => {
  const inicioSessao = new Date('2026-09-01T10:00:00.000Z').getTime();
  useTimer.setState({
    topicoId: 't1',
    topicoNome: 'T',
    status: 'paused',
    iniciadaEm: null,
    sessaoIniciadaEm: inicioSessao,
    acumulado: 120,
  });
  await renderTela();
  await fireEvent.press(screen.getByText('Parar'));
  const [payload] = mockSalvarCronometro.mutate.mock.calls[0];
  expect(payload.iniciadaEm).toBe(new Date(inicioSessao).toISOString());
  expect(payload.duracaoSegundos).toBe(120);
});

test('toque duplo em Parar não dispara duas mutations', async () => {
  const inicio = Date.now() - 60_000;
  useTimer.setState({
    topicoId: 't1',
    topicoNome: 'T',
    status: 'running',
    iniciadaEm: inicio,
    sessaoIniciadaEm: inicio,
    acumulado: 0,
  });
  await renderTela();
  await fireEvent.press(screen.getByText('Parar'));
  await fireEvent.press(screen.getByText('Parar'));
  expect(mockSalvarCronometro.mutate).toHaveBeenCalledTimes(1);
});
