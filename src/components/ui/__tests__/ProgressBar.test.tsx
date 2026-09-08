import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ProgressBar } from '../ProgressBar';

test('faz clamp de valor acima de 1', async () => {
  await render(
    <ThemeProvider>
      <ProgressBar value={1.7} testID="pb" />
    </ThemeProvider>,
  );
  expect(screen.getByTestId('pb-fill').props.style).toEqual(
    expect.objectContaining({ width: '100%' }),
  );
});
