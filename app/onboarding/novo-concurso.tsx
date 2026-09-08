import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, useToast } from '@/components/ui';
import {
  concursoInputSchema,
  arvoreSchema,
  type Arvore,
  type ConcursoInput,
} from '@/features/concurso/schema';
import { parseEditalTexto } from '@/features/concurso/parseEditalTexto';
import { ArvoreEditor } from '@/features/concurso/ArvoreEditor';
import { useCriarConcurso } from '@/features/concurso/hooks';
import type { AppError } from '@/lib/errors';

export default function NovoConcurso() {
  const router = useRouter();
  const toast = useToast();
  const criar = useCriarConcurso();
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<ConcursoInput>({ nome: '' });
  const [erroDados, setErroDados] = useState<string>();
  const [texto, setTexto] = useState('');
  const [arvore, setArvore] = useState<Arvore>({ disciplinas: [] });

  function avancarDados() {
    const r = concursoInputSchema.safeParse(dados);
    if (!r.success) {
      setErroDados(r.error.issues[0].message);
      return;
    }
    setErroDados(undefined);
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
    } catch (e) {
      toast.erro((e as AppError).message);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Novo concurso — passo {passo} de 3</Text>

      {passo === 1 && (
        <>
          <Input
            label="Nome do concurso"
            value={dados.nome}
            onChangeText={(t) => setDados((d) => ({ ...d, nome: t }))}
            error={erroDados}
          />
          <Input
            label="Banca (opcional)"
            value={dados.banca ?? ''}
            onChangeText={(t) => setDados((d) => ({ ...d, banca: t }))}
          />
          <Input
            label="Cargo (opcional)"
            value={dados.cargo ?? ''}
            onChangeText={(t) => setDados((d) => ({ ...d, cargo: t }))}
          />
          <Input
            label="Data da prova AAAA-MM-DD (opcional)"
            value={dados.data_prova ?? ''}
            onChangeText={(t) => setDados((d) => ({ ...d, data_prova: t || undefined }))}
          />
          <Button label="Continuar" onPress={avancarDados} />
        </>
      )}

      {passo === 2 && (
        <>
          <Text>Cole aqui a lista de conteúdos do edital.</Text>
          <Input label="Texto do edital" value={texto} onChangeText={setTexto} multiline />
          <Button label="Anexar PDF (em breve)" variant="secondary" disabled onPress={() => {}} />
          <Button label="Processar texto" onPress={processarTexto} disabled={!texto.trim()} />
          <Button label="Voltar" variant="ghost" onPress={() => setPasso(1)} />
        </>
      )}

      {passo === 3 && (
        <>
          <Text>Revise e ajuste a estrutura antes de salvar.</Text>
          <ArvoreEditor value={arvore} onChange={setArvore} />
          <Button label="Criar concurso" onPress={confirmar} loading={criar.isPending} />
          <Button label="Voltar" variant="ghost" onPress={() => setPasso(2)} />
        </>
      )}
    </ScrollView>
  );
}
