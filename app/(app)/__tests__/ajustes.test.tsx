import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import Ajustes from '../ajustes';

const mockSignOut = jest.fn();
const mockUpdateSettings = jest.fn();
const mockArquivar = jest.fn();
const mockDefinirAtivo = jest.fn();
const mockPush = jest.fn();

jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, signOut: mockSignOut }),
}));
jest.mock('@/features/settings/hooks', () => ({
  useProfile: () => ({
    data: {
      display_name: 'Igor',
      active_concurso_id: 'c1',
      settings: { tema: 'system', limiaresRevisaoDias: [7, 15, 30] },
    },
  }),
  useUpdateSettings: () => ({ mutate: mockUpdateSettings }),
}));
jest.mock('@/features/concurso/hooks', () => ({
  useConcursos: () => ({
    data: [
      { id: 'c1', nome: 'TRT-4', status: 'ativo' },
      { id: 'c2', nome: 'INSS', status: 'ativo' },
    ],
  }),
  useArquivarConcurso: () => ({ mutate: mockArquivar }),
  useDefinirConcursoAtivo: () => ({ mutate: mockDefinirAtivo }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const wrap = () =>
  render(
    <ThemeProvider>
      <ToastProvider>
        <Ajustes />
      </ToastProvider>
    </ThemeProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
});

test('mostra nome e o concurso ativo', async () => {
  await wrap();
  expect(screen.getByText('Igor')).toBeOnTheScreen();
  expect(screen.getByText('TRT-4')).toBeOnTheScreen();
});

test('botão Sair chama signOut', async () => {
  await wrap();
  await fireEvent.press(screen.getByText('Sair'));
  expect(mockSignOut).toHaveBeenCalled();
});

test('trocar tema persiste em settings.tema', async () => {
  await wrap();
  await fireEvent.press(screen.getByText('Escuro'));
  expect(mockUpdateSettings).toHaveBeenCalledWith({ tema: 'dark' });
});

test('editar limiar de revisão dispara updateSettings ordenado', async () => {
  await wrap();
  await fireEvent.changeText(screen.getByLabelText('1ª revisão (dias)'), '20');
  expect(mockUpdateSettings).toHaveBeenCalledWith({ limiaresRevisaoDias: [15, 20, 30] });
});

test('"Tornar ativo" aparece só para concurso não ativo e chama a mutation', async () => {
  await wrap();
  await fireEvent.press(screen.getByText('Tornar ativo'));
  expect(mockDefinirAtivo).toHaveBeenCalledWith('c2');
});

test('arquivar pede confirmação via Alert antes de mutacionar', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await wrap();
  await fireEvent.press(screen.getAllByText('Arquivar')[1]);
  expect(alertSpy).toHaveBeenCalled();
  const botoes = alertSpy.mock.calls[0][2] ?? [];
  const confirmar = botoes.find((b) => b.style === 'destructive');
  confirmar?.onPress?.();
  expect(mockArquivar).toHaveBeenCalledWith('c2');
  alertSpy.mockRestore();
});

test('"Novo concurso" navega para o onboarding', async () => {
  await wrap();
  await fireEvent.press(screen.getByText('Novo concurso'));
  expect(mockPush).toHaveBeenCalledWith('/onboarding/novo-concurso');
});
