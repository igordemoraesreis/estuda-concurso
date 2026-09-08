import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, useToast } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import {
  concursoInputSchema,
  arvoreSchema,
  type Arvore,
  type ConcursoInput,
} from '@/features/concurso/schema';
import { parseEditalTexto } from '@/features/concurso/parseEditalTexto';
import { ArvoreEditor } from '@/features/concurso/ArvoreEditor';
import { useCriarConcurso } from '@/features/concurso/hooks';

type CampoDados = keyof ConcursoInput;
type ErrosDados = Partial<Record<CampoDados, string>>;

export default function NovoConcurso() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const criar = useCriarConcurso();
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<ConcursoInput>({ nome: '' });
  const [erroDados, setErroDados] = useState<ErrosDados>({});
  const [texto, setTexto] = useState('');
  const [arvore, setArvore] = useState<Arvore>({ disciplinas: [] });

  function avancarDados() {
    const r = concursoInputSchema.safeParse(dados);
    if (!r.success) {
      // Cada mensagem vai para o campo que a originou, não toda no `nome`.
      const novo: ErrosDados = {};
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as CampoDados | undefined;
        if (campo && !novo[campo]) novo[campo] = issue.message;
      }
      setErroDados(novo);
      return;
    }
    setErroDados({});
    setPasso(2);
  }
  function processarTexto() {
    setArvore(parseEditalTexto(texto));
    setPasso(3);
  }
  async function confirmar() {
    const r = arvoreSchema.safeParse(arvore);
    if (!r.success) {
      toast.erro(r.error.issues[0].message);
      return;
    }
    try {
      await criar.mutateAsync({ concurso: dados, disciplinas: r.data.disciplinas });
      toast.sucesso('Concurso criado!');
      router.replace('/(app)');
    } catch {
      // erro já exibido pelo MutationCache global
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text style={{ color: c('text'), fontSize: 22, fontWeight: '700' }}>
          Novo concurso — passo {passo} de 3
        </Text>

        {passo === 1 && (
          <>
            <Input
              label="Nome do concurso"
              value={dados.nome}
              onChangeText={(t) => setDados((d) => ({ ...d, nome: t }))}
              error={erroDados.nome}
            />
            <Input
              label="Banca (opcional)"
              value={dados.banca ?? ''}
              onChangeText={(t) => setDados((d) => ({ ...d, banca: t }))}
              error={erroDados.banca}
            />
            <Input
              label="Cargo (opcional)"
              value={dados.cargo ?? ''}
              onChangeText={(t) => setDados((d) => ({ ...d, cargo: t }))}
              error={erroDados.cargo}
            />
            <Input
              label="Data da prova AAAA-MM-DD (opcional)"
              value={dados.data_prova ?? ''}
              onChangeText={(t) => setDados((d) => ({ ...d, data_prova: t || undefined }))}
              error={erroDados.data_prova}
            />
            <Button label="Continuar" onPress={avancarDados} />
          </>
        )}

        {passo === 2 && (
          <>
            <Text style={{ color: c('text') }}>Cole aqui a lista de conteúdos do edital.</Text>
            <Input label="Texto do edital" value={texto} onChangeText={setTexto} multiline />
            <Button label="Anexar PDF (em breve)" variant="secondary" disabled onPress={() => {}} />
            <Button label="Processar texto" onPress={processarTexto} disabled={!texto.trim()} />
            <Button label="Voltar" variant="ghost" onPress={() => setPasso(1)} />
          </>
        )}

        {passo === 3 && (
          <>
            <Text style={{ color: c('text') }}>Revise e ajuste a estrutura antes de salvar.</Text>
            <ArvoreEditor value={arvore} onChange={setArvore} />
            <Button label="Criar concurso" onPress={confirmar} loading={criar.isPending} />
            <Button label="Voltar" variant="ghost" onPress={() => setPasso(2)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
