import { render } from '@testing-library/react-native';
import { ThemeRehydrator } from '../ThemeRehydrator';

const mockSetOverride = jest.fn();

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ setOverride: mockSetOverride }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } } }),
}));
jest.mock('@/features/settings/hooks', () => ({
  useProfile: () => ({
    data: {
      id: 'u1',
      display_name: 'Teste',
      active_concurso_id: 'c1',
      settings: { tema: 'dark', limiaresRevisaoDias: [7, 15, 30] },
    },
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('reaplica o tema salvo (dark) uma única vez quando o profile carrega', async () => {
  const { rerender } = await render(<ThemeRehydrator />);
  rerender(<ThemeRehydrator />);
  expect(mockSetOverride).toHaveBeenCalledWith('dark');
  expect(mockSetOverride).toHaveBeenCalledTimes(1);
});
