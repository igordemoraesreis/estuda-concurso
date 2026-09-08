import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import {
  useArquivarConcurso,
  useConcursos,
  useDefinirConcursoAtivo,
} from '@/features/concurso/hooks';

export function TrocarConcurso({ activeConcursoId }: { activeConcursoId: string | null }) {
  const { c } = useTheme();
  const router = useRouter();
  const { data: concursos } = useConcursos();
  const arquivar = useArquivarConcurso();
  const definirAtivo = useDefinirConcursoAtivo();

  function confirmarArquivar(id: string, nome: string) {
    Alert.alert(
      'Arquivar concurso',
      `Arquivar "${nome}"? Ele sai da lista ativa, mas seus dados ficam guardados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Arquivar', style: 'destructive', onPress: () => arquivar.mutate(id) },
      ],
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {(concursos ?? []).map((concurso) => {
        const ativo = concurso.id === activeConcursoId;
        const arquivado = concurso.status === 'arquivado';
        return (
          <Card key={concurso.id} style={{ gap: 8 }}>
            <Text style={{ color: c('text'), fontWeight: '600' }}>{concurso.nome}</Text>
            <Text style={{ color: c('muted'), fontSize: 12 }}>
              {ativo ? 'Ativo' : arquivado ? 'Arquivado' : 'Inativo'}
            </Text>
            {!ativo && !arquivado ? (
              <Button
                label="Tornar ativo"
                variant="secondary"
                onPress={() => definirAtivo.mutate(concurso.id)}
              />
            ) : null}
            {!arquivado ? (
              <Button
                label="Arquivar"
                variant="ghost"
                onPress={() => confirmarArquivar(concurso.id, concurso.nome)}
              />
            ) : null}
          </Card>
        );
      })}
      <Button
        label="Novo concurso"
        variant="secondary"
        onPress={() => router.push('/onboarding/novo-concurso')}
      />
    </View>
  );
}
