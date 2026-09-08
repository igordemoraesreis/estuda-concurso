import '../global.css';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
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

function ThemedRoot({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <View style={{ flex: 1, backgroundColor: c('bg') }}>{children}</View>;
}

export default function RootLayout() {
  // Zera o cache do React Query quando a identidade muda (sign-out / troca de conta).
  useEffect(() => installAuthCacheReset(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot>
            <ToastProvider>
              <AuthGate>
                <TimerHydrator />
                <ThemeRehydrator />
                <Slot />
                <TimerPill />
              </AuthGate>
            </ToastProvider>
          </ThemedRoot>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
