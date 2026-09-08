import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useToast } from '@/components/ui';
import { useTopico, useToggleConcluido } from '@/features/edital/useTopico';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import type { AppError } from '@/lib/errors';

export default function TopicoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const toast = useToast();
  const { data: concurso } = useConcursoAtivo();
  const { data: topico, isLoading } = useTopico(id);
  const toggle = useToggleConcluido(concurso?.id ?? null);

  if (isLoading || !topico) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ color: c('text'), fontSize: 24, fontWeight: '700' }}>{topico.nome}</Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: c('text') }}>Concluído</Text>
          <Switch
            value={topico.concluido}
            onValueChange={(v) =>
              toggle.mutate(
                { topicoId: topico.id, concluido: v },
                { onError: (e) => toast.erro((e as AppError).message) },
              )
            }
          />
        </View>

        {/* Cronômetro de estudo (Task 14) entra aqui */}
        {/* Sessões de exercício (Task 15) entram aqui */}
      </ScrollView>
    </SafeAreaView>
  );
}
