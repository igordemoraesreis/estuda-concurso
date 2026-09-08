import { useEffect, type ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from './useSession';
import { useProfile } from '@/features/settings/hooks';

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const { data: profile, isLoading: pLoading } = useProfile(session?.user.id ?? null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || (session && pLoading)) return;
    const grupo = segments[0];
    if (!session) {
      if (grupo !== '(auth)') router.replace('/(auth)/sign-in');
      return;
    }
    const temConcurso = !!profile?.active_concurso_id;
    if (!temConcurso && grupo !== 'onboarding') router.replace('/onboarding/novo-concurso');
    else if (temConcurso && (grupo === '(auth)' || grupo === 'onboarding')) router.replace('/(app)');
  }, [loading, pLoading, session, profile, segments, router]);

  if (loading || (session && pLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <>{children}</>;
}
