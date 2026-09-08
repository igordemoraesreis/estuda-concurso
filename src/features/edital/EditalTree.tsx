import { Pressable, ScrollView, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import type { ArvoreCarregada, DisciplinaRow, TopicoRow } from './api';

function topicosDaDisciplina(d: DisciplinaRow): TopicoRow[] {
  return [...d.topicos, ...d.assuntos.flatMap((a) => a.topicos)];
}

export function EditalTree({
  data,
  onAbrirDisciplina,
  onAbrirTopico,
}: {
  data: ArvoreCarregada;
  onAbrirDisciplina: (id: string) => void;
  onAbrirTopico: (id: string) => void;
}) {
  const { c } = useTheme();

  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
      {data.disciplinas.map((d) => {
        const todos = topicosDaDisciplina(d);
        const total = todos.length;
        const concluidos = todos.filter((t) => t.concluido).length;
        const progresso = total > 0 ? concluidos / total : 0;

        return (
          <View
            key={d.id}
            style={{ borderColor: c('border'), borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir disciplina ${d.nome}`}
              onPress={() => onAbrirDisciplina(d.id)}
              style={{ gap: 6 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: c('text'), fontSize: 16, fontWeight: '600' }}>{d.nome}</Text>
                <Text style={{ color: c('muted'), fontSize: 13 }}>
                  {concluidos}/{total}
                </Text>
              </View>
              <ProgressBar value={progresso} testID={`progresso-${d.id}`} />
            </Pressable>

            {d.assuntos.map((a) => (
              <View key={a.id} style={{ gap: 6, marginLeft: 8 }}>
                <Text style={{ color: c('muted'), fontSize: 13, fontWeight: '600' }}>{a.nome}</Text>
                {a.topicos.map((t) => (
                  <TopicoLinha key={t.id} topico={t} onPress={() => onAbrirTopico(t.id)} />
                ))}
              </View>
            ))}

            {d.topicos.map((t) => (
              <TopicoLinha key={t.id} topico={t} onPress={() => onAbrirTopico(t.id)} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function TopicoLinha({ topico, onPress }: { topico: TopicoRow; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir tópico ${topico.nome}`}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
    >
      <Text style={{ color: topico.concluido ? c('primary') : c('muted') }}>
        {topico.concluido ? '☑' : '☐'}
      </Text>
      <Text style={{ color: c('text'), flex: 1 }}>{topico.nome}</Text>
    </Pressable>
  );
}
