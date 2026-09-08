import { render, screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider, useToast } from '../Toast';

function Trigger() {
  const t = useToast();
  return <Text onPress={() => t.sucesso('Feito!')}>disparar</Text>;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('exibe toast de sucesso', async () => {
  await render(
    <ThemeProvider>
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    </ThemeProvider>,
  );
  await act(async () => {
    screen.getByText('disparar').props.onPress();
  });
  expect(screen.getByText('Feito!')).toBeOnTheScreen();
});

test('some após o tempo de exibição', async () => {
  await render(
    <ThemeProvider>
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    </ThemeProvider>,
  );
  await act(async () => {
    screen.getByText('disparar').props.onPress();
  });
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(screen.queryByText('Feito!')).toBeNull();
});
