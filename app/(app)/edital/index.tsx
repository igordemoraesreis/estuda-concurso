import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/ui';
import { EditalTree } from '@/features/edital/EditalTree';
import { useArvore } from '@/features/edital/hooks';
import { useConcursoAtivo } from '@/features/concurso/hooks';

export default function Edital() {
  const router = useRouter();
  const { data: concurso } = useConcursoAtivo();
  const { data: arvore, isLoading } = useArvore(concurso?.id ?? null);

  if (isLoading) return null;
  if (!arvore || arvore.disciplinas.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState
          titulo="Edital vazio"
          descricao="Adicione disciplinas para começar a acompanhar o progresso."
          acao={{
            label: 'Adicionar disciplina',
            onPress: () => router.push('/(app)/edital/disciplina/nova'),
          }}
        />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <EditalTree
        data={arvore}
        onAbrirDisciplina={(id) => router.push(`/(app)/edital/disciplina/${id}`)}
        onAbrirTopico={(id) => router.push(`/(app)/edital/topico/${id}`)}
      />
    </SafeAreaView>
  );
}
