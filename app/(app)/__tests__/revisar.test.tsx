import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import Revisar from '../revisar';
import type { GrupoRevisao } from '@/features/revisao/hooks';

const mockPush = jest.fn();
let mockRevisao: { data: GrupoRevisao[] | null; isLoading: boolean } = {
  data: [
    {
      limiarDias: 30,
      itens: [
        {
          topicoId: 't1',
          nome: 'Crase',
          disciplinaNome: 'Português',
          concluidoEm: '2026-08-01T12:00:00Z',
          diasDesde: 40,
        },
      ],
    },
  ],
  isLoading: false,
};

jest.mock('@/features/concurso/hooks', () => ({
  useConcursoAtivo: () => ({ data: { id: 'c1', nome: 'C' } }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } } }),
}));
jest.mock('@/features/settings/hooks', () => ({
  useProfile: () => ({ data: { settings: { limiaresRevisaoDias: [7, 15, 30] } } }),
}));
jest.mock('@/features/revisao/hooks', () => ({
  useRevisao: () => mockRevisao,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const renderTela = () =>
  render(
    <ThemeProvider>
      <Revisar />
    </ThemeProvider>,
  );

// RNTL v14: render é assíncrono.

beforeEach(() => {
  mockPush.mockClear();
});

test('lista item de revisão sob o cabeçalho do grupo', async () => {
  await renderTela();
  expect(screen.getByText('Crase')).toBeOnTheScreen();
  expect(screen.getByText(/30/)).toBeOnTheScreen();
  expect(screen.getByText(/Português · há 40 dias/)).toBeOnTheScreen();
});

test('toca no item e navega para o tópico', async () => {
  await renderTela();
  fireEvent.press(screen.getByText('Crase'));
  expect(mockPush).toHaveBeenCalledWith('/(app)/edital/topico/t1');
});

test('mostra EmptyState quando não há grupos', async () => {
  mockRevisao = { data: [], isLoading: false };
  await renderTela();
  expect(screen.getByText('Nada para revisar por enquanto')).toBeOnTheScreen();
});
