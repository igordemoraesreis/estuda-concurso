import { render, screen, fireEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Button } from '../Button';

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

test('dispara onPress', async () => {
  const fn = jest.fn();
  await wrap(<Button label="Salvar" onPress={fn} />);
  fireEvent.press(screen.getByText('Salvar'));
  expect(fn).toHaveBeenCalled();
});

test('não dispara onPress quando loading', async () => {
  const fn = jest.fn();
  await wrap(<Button label="Salvar" onPress={fn} loading />);
  fireEvent.press(screen.getByRole('button'));
  expect(fn).not.toHaveBeenCalled();
});
