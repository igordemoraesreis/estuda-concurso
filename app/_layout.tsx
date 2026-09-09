import '../global.css';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import {
  Slot,
  ThemeProvider as NavThemeProvider,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
} from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installAuthCacheReset, queryClient } from '@/lib/query';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ThemeRehydrator } from '@/theme/ThemeRehydrator';
import { ToastProvider } from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { TimerPill } from '@/features/estudo/TimerPill';
import { useTimer } from '@/features/estudo/timerStore';

function TimerHydrator() {
  useEffect(() => {
    useTimer.getState().hydrate();
  }, []);
  return null;
}

/**
 * Sincroniza o tema do React Navigation com o tema do app (senão o container
 * das telas pinta um cinza fixo do tema padrão da navegação por baixo do
 * conteúdo — visível no dark mode). No web, também limita a largura a uma
 * coluna de celular centralizada.
 */
function ThemedShell({ children }: { children: ReactNode }) {
  const { scheme, c } = useTheme();
  const web = Platform.OS === 'web';

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? NavDark : NavLight;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: c('bg'),
        card: c('bg'),
        text: c('text'),
        border: c('border'),
        primary: c('primary'),
        notification: c('primary'),
      },
    };
  }, [scheme, c]);

  return (
    <NavThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: web ? c('surface') : c('bg') }}>
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: web ? 480 : undefined,
            alignSelf: 'center',
            backgroundColor: c('bg'),
          }}
        >
          {children}
        </View>
      </View>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  // Zera o cache do React Query quando a identidade muda (sign-out / troca de conta).
  useEffect(() => installAuthCacheReset(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedShell>
            <ToastProvider>
              <AuthGate>
                <TimerHydrator />
                <ThemeRehydrator />
                <Slot />
                <TimerPill />
              </AuthGate>
            </ToastProvider>
          </ThemedShell>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
