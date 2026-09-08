import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View } from 'react-native';
import { Card, Stat, ProgressBar, EmptyState } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import { useProgresso } from '@/features/progresso/hooks';
import { formatarPct, formatarDuracao } from '@/features/progresso/format';

export default function Painel() {
  const { c } = useTheme();
  const { data: concurso } = useConcursoAtivo();
  const { data, isLoading } = useProgresso(concurso?.id ?? null);

  if (isLoading || !data) return null;
  const semConteudo = data.disciplinas.length === 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: c('text'), fontSize: 22, fontWeight: '700' }}>{concurso?.nome}</Text>

        {semConteudo ? (
          <EmptyState
            titulo="Sem disciplinas ainda"
            descricao="Cadastre o conteúdo do edital para ver seu progresso."
          />
        ) : (
          <>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Stat rotulo="Cobertura do edital" valor={formatarPct(data.cobertura)} />
                <Stat rotulo="Ponderada por peso" valor={formatarPct(data.coberturaPonderada)} />
              </View>
              <View style={{ marginTop: 8 }}>
                <ProgressBar value={data.cobertura} />
              </View>
            </Card>

            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Stat rotulo="Aproveitamento" valor={formatarPct(data.aproveitamentoGeral)} />
                <Stat
                  rotulo="Tempo total"
                  valor={formatarDuracao(data.tempoTotalSegundos)}
                  sub={`${formatarDuracao(data.tempo7diasSegundos)} nos últimos 7 dias`}
                />
              </View>
            </Card>

            <Text style={{ color: c('muted'), marginTop: 8 }}>Por disciplina</Text>
            {data.disciplinas.map((d) => (
              <Card key={d.id}>
                <Text style={{ color: c('text'), fontWeight: '600' }}>
                  {d.nome} · peso {d.peso}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <ProgressBar value={d.cobertura} />
                </View>
                <Text style={{ color: c('muted'), fontSize: 12, marginTop: 6 }}>
                  {formatarPct(d.cobertura)} concluído · aproveitamento{' '}
                  {formatarPct(d.aproveitamento)} · {formatarDuracao(d.tempoSegundos)}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
