import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';

export function EmptyState({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: { label: string; onPress: () => void };
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8, padding: 32 }}>
      <Text style={{ color: c('text'), fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
        {titulo}
      </Text>
      {descricao ? (
        <Text style={{ color: c('muted'), textAlign: 'center' }}>{descricao}</Text>
      ) : null}
      {acao ? (
        <View style={{ marginTop: 8 }}>
          <Button label={acao.label} onPress={acao.onPress} />
        </View>
      ) : null}
    </View>
  );
}
