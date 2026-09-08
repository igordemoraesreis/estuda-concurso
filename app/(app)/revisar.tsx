import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, EmptyState } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import { useSession } from '@/features/auth/useSession';
import { useProfile } from '@/features/settings/hooks';
import { useRevisao } from '@/features/revisao/hooks';

const LIMIARES_PADRAO = [7, 15, 30];

export default function Revisar() {
  const { c } = useTheme();
  const router = useRouter();
  const { data: concurso } = useConcursoAtivo();
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id ?? null);
  const limiares = profile?.settings?.limiaresRevisaoDias ?? LIMIARES_PADRAO;
  const { data: grupos, isLoading } = useRevisao(concurso?.id ?? null, limiares);

  if (isLoading) return null;

  if (!grupos || grupos.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState
          titulo="Nada para revisar por enquanto"
          descricao="Conclua tópicos no edital para que apareçam aqui na hora certa."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {grupos.map((grupo) => (
          <View key={grupo.limiarDias} style={{ gap: 8 }}>
            <Text style={{ color: c('text'), fontSize: 18, fontWeight: '700' }}>
              Concluídos há {grupo.limiarDias}+ dias
            </Text>
            {grupo.itens.map((item) => (
              <Pressable
                key={item.topicoId}
                onPress={() => router.push(`/(app)/edital/topico/${item.topicoId}`)}
              >
                <Card>
                  <Text style={{ color: c('text'), fontWeight: '600' }}>{item.nome}</Text>
                  <Text style={{ color: c('muted'), fontSize: 12, marginTop: 4 }}>
                    {item.disciplinaNome} · há {item.diasDesde}{' '}
                    {item.diasDesde === 1 ? 'dia' : 'dias'}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
