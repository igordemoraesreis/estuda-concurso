import { render, screen } from '@testing-library/react-native';
import Index from '../app/index';

test('a tela inicial renderiza o nome do app', async () => {
  await render(<Index />);
  expect(screen.getByText('Estuda Concurso')).toBeOnTheScreen();
});
