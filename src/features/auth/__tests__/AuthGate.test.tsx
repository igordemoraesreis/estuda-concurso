import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthGate } from '../AuthGate';

type SessionMock = { session: { user: { id: string } } | null; loading: boolean };
type ProfileMock = { data: { active_concurso_id: string | null } | null; isLoading: boolean };

let mockSession: SessionMock = { session: null, loading: false };
let mockProfile: ProfileMock = { data: null, isLoading: false };
let mockSegments: string[] = ['(app)'];
const mockReplace = jest.fn();

jest.mock('../useSession', () => ({ useSession: () => mockSession }));
jest.mock('@/features/settings/hooks', () => ({ useProfile: () => mockProfile }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}));

const renderGate = () =>
  render(
    <AuthGate>
      <Text>conteúdo</Text>
    </AuthGate>,
  );

beforeEach(() => {
  mockReplace.mockClear();
  mockSession = { session: null, loading: false };
  mockProfile = { data: null, isLoading: false };
  mockSegments = ['(app)'];
});

test('(a) sem sessão redireciona para sign-in', async () => {
  await renderGate();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in'));
});

test('(a) sem sessão e já em (auth) não redireciona', async () => {
  mockSegments = ['(auth)'];
  await renderGate();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('(b) com sessão e sem concurso ativo manda para o onboarding', async () => {
  mockSession = { session: { user: { id: 'u1' } }, loading: false };
  mockProfile = { data: { active_concurso_id: null }, isLoading: false };
  await renderGate();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/novo-concurso'));
});

test('(b) já no onboarding não redireciona de novo', async () => {
  mockSession = { session: { user: { id: 'u1' } }, loading: false };
  mockProfile = { data: { active_concurso_id: null }, isLoading: false };
  mockSegments = ['onboarding'];
  await renderGate();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('(c) com concurso ativo e ainda em (auth) vai para o app', async () => {
  mockSession = { session: { user: { id: 'u1' } }, loading: false };
  mockProfile = { data: { active_concurso_id: 'c1' }, isLoading: false };
  mockSegments = ['(auth)'];
  await renderGate();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)'));
});

test('(c) com concurso ativo dentro de (app) renderiza o conteúdo sem redirecionar', async () => {
  mockSession = { session: { user: { id: 'u1' } }, loading: false };
  mockProfile = { data: { active_concurso_id: 'c1' }, isLoading: false };
  await renderGate();
  expect(screen.getByText('conteúdo')).toBeOnTheScreen();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('(d) enquanto a sessão carrega mostra spinner e não redireciona', async () => {
  mockSession = { session: null, loading: true };
  await renderGate();
  // Spinner no lugar do conteúdo, e nenhum redirecionamento enquanto não se sabe nada.
  expect(screen.queryByText('conteúdo')).toBeNull();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('(d) enquanto o profile carrega mostra spinner e não redireciona', async () => {
  mockSession = { session: { user: { id: 'u1' } }, loading: false };
  mockProfile = { data: null, isLoading: true };
  await renderGate();
  expect(screen.queryByText('conteúdo')).toBeNull();
  expect(mockReplace).not.toHaveBeenCalled();
});
