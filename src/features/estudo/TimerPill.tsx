import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useTimer, segundosDecorridos } from './timerStore';

export function formatarMMSS(totalSegundos: number): string {
  const s = Math.max(0, Math.floor(totalSegundos));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function TimerPill() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const status = useTimer((s) => s.status);
  const topicoNome = useTimer((s) => s.topicoNome);
  const iniciadaEm = useTimer((s) => s.iniciadaEm);
  const acumulado = useTimer((s) => s.acumulado);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status === 'idle') return null;

  const segundos = segundosDecorridos({ status, iniciadaEm, acumulado });
  const rodando = status === 'running';

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16, alignItems: 'center' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: c('surface'),
          borderColor: c('border'),
          borderWidth: 1,
          borderRadius: 9999,
          paddingVertical: 10,
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Text numberOfLines={1} style={{ color: c('text'), maxWidth: 160, fontWeight: '600' }}>
          {topicoNome ?? 'Estudo'}
        </Text>
        <Text style={{ color: c('muted'), fontVariant: ['tabular-nums'] }}>
          {formatarMMSS(segundos)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rodando ? 'Pausar cronômetro' : 'Retomar cronômetro'}
          onPress={() => (rodando ? useTimer.getState().pause() : useTimer.getState().resume())}
          style={{
            backgroundColor: c('primary'),
            borderRadius: 9999,
            paddingVertical: 6,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{rodando ? 'Pausar' : 'Retomar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
