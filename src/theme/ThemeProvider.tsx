import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { tokens } from './tokens';

type Scheme = 'light' | 'dark';
type Override = Scheme | 'system';
type ColorName = keyof typeof tokens.colors;

const Ctx = createContext<{
  scheme: Scheme;
  setOverride: (o: Override) => void;
  c: (name: ColorName) => string;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<Override>('system');
  const scheme: Scheme = override === 'system' ? (system === 'dark' ? 'dark' : 'light') : override;

  const value = useMemo(
    () => ({ scheme, setOverride, c: (name: ColorName) => tokens.colors[name][scheme] }),
    [scheme],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme fora de ThemeProvider');
  return v;
}
