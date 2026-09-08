import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Input } from '../Input';

test('mostra a mensagem de erro', async () => {
  await render(
    <ThemeProvider>
      <Input label="E-mail" value="" onChangeText={() => {}} error="Campo obrigatório" />
    </ThemeProvider>,
  );
  expect(screen.getByText('Campo obrigatório')).toBeOnTheScreen();
});
