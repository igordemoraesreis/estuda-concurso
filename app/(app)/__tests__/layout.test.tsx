import { createElement, Fragment, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import AppLayout from '../_layout';

// `mock`-prefixed aliases so the hoisted jest.mock factory can use them, and so the
// nativewind babel plugin does not rewrite a bare `React.createElement` call to an
// out-of-scope helper inside the factory.
const mockCreateElement = createElement;
const mockFragment = Fragment;

jest.mock('@/features/concurso/hooks', () => ({
  useConcursoAtivo: () => ({ data: { id: 'c1', nome: 'TRT-4', status: 'ativo' }, isLoading: false }),
}));
jest.mock('expo-router', () => ({
  Tabs: Object.assign(
    ({ children }: { children?: ReactNode }) => mockCreateElement(mockFragment, null, children),
    {
      Screen: ({ options }: { options?: { title?: string } }) =>
        mockCreateElement('Text', null, options?.title),
    },
  ),
}));

test('renderiza os títulos das 4 abas', async () => {
  await render(
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>,
  );
  for (const t of ['Painel', 'Edital', 'Revisar', 'Ajustes']) {
    expect(screen.getByText(t)).toBeOnTheScreen();
  }
});
