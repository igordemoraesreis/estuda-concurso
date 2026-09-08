import { useTimer, segundosDecorridos } from '../timerStore';

beforeEach(() => useTimer.getState().reset());

test('start define topico e status running', () => {
  useTimer.getState().start('t1', 'Crase');
  expect(useTimer.getState().status).toBe('running');
  expect(useTimer.getState().topicoId).toBe('t1');
});

test('segundosDecorridos soma acumulado + segmento atual', () => {
  const t0 = 1_000_000_000_000;
  useTimer.setState({ status: 'running', iniciadaEm: t0, acumulado: 30, topicoId: 't1', topicoNome: 'X' });
  expect(segundosDecorridos(useTimer.getState(), new Date(t0 + 10_000))).toBe(40);
});

test('pause congela o acumulado e zera iniciadaEm', () => {
  const t0 = 1_000_000_000_000;
  useTimer.setState({ status: 'running', iniciadaEm: t0, acumulado: 0, topicoId: 't1', topicoNome: 'X' });
  useTimer.getState().pause(new Date(t0 + 5_000));
  expect(useTimer.getState().status).toBe('paused');
  expect(useTimer.getState().acumulado).toBe(5);
  expect(useTimer.getState().iniciadaEm).toBeNull();
});

test('resume retoma a contagem', () => {
  useTimer.setState({ status: 'paused', iniciadaEm: null, acumulado: 5, topicoId: 't1', topicoNome: 'X' });
  const t1 = 2_000_000_000_000;
  useTimer.getState().resume(new Date(t1));
  expect(useTimer.getState().status).toBe('running');
  expect(useTimer.getState().iniciadaEm).toBe(t1);
});
