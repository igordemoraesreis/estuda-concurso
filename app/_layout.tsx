import '../global.css';
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query';
import { ThemeProvider } from '@/theme/ThemeProvider';
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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthGate>
              <TimerHydrator />
              <Slot />
              <TimerPill />
            </AuthGate>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
