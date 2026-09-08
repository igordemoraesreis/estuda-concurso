import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Stat({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: c('muted'), fontSize: 12 }}>{rotulo}</Text>
      <Text style={{ color: c('text'), fontSize: 26, fontWeight: '700' }}>{valor}</Text>
      {sub ? <Text style={{ color: c('muted'), fontSize: 12 }}>{sub}</Text> : null}
    </View>
  );
}
