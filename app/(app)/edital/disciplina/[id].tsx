import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, EmptyState, Input, useToast } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import { useArvore, useEditalMutations } from '@/features/edital/hooks';

export default function DisciplinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { c } = useTheme();
  const { data: concurso } = useConcursoAtivo();
  const concursoId = concurso?.id ?? null;
  const { data: arvore, isLoading } = useArvore(concursoId);
  const mut = useEditalMutations(concursoId);

  const [nomeNova, setNomeNova] = useState('');
  const disc = arvore?.disciplinas.find((d) => d.id === id) ?? null;

  if (id === 'nova') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <Text style={{ color: c('text'), fontSize: 20, fontWeight: '700' }}>Nova disciplina</Text>
          <Input label="Nome da disciplina" value={nomeNova} onChangeText={setNomeNova} />
          <Button
            label="Criar disciplina"
            loading={mut.addDisciplina.isPending}
            disabled={!nomeNova.trim()}
            onPress={async () => {
              try {
                await mut.addDisciplina.mutateAsync({
                  nome: nomeNova.trim(),
                  ordem: arvore?.disciplinas.length ?? 0,
                });
                toast.sucesso('Disciplina criada!');
                router.back();
              } catch {
                // erro já exibido pelo MutationCache global
              }
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading) return null;
  if (!disc) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState titulo="Disciplina não encontrada" descricao="Ela pode ter sido removida." />
      </SafeAreaView>
    );
  }

  const definirPeso = (peso: number) =>
    mut.updateDisciplina.mutate({ id: disc.id, patch: { peso } });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <CampoNome
          key={disc.id}
          label="Nome da disciplina"
          valorInicial={disc.nome}
          onSalvar={(v) => mut.updateDisciplina.mutate({ id: disc.id, patch: { nome: v } })}
        />

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={{ color: c('muted') }}>Peso</Text>
          {[1, 2, 3, 4, 5].map((p) => (
            <Pressable
              key={p}
              accessibilityLabel={`Peso ${p}`}
              onPress={() => definirPeso(p)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: disc.peso === p ? c('primary') : c('surface'),
              }}
            >
              <Text style={{ color: disc.peso === p ? '#FFF' : c('text') }}>{p}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: c('text'), fontSize: 16, fontWeight: '600' }}>Tópicos</Text>
        {disc.topicos.map((t) => (
          <LinhaEditavel
            key={t.id}
            label="Tópico"
            valorInicial={t.nome}
            onSalvar={(v) => mut.updateTopico.mutate({ id: t.id, patch: { nome: v } })}
            onRemover={() => mut.deleteTopico.mutate({ id: t.id })}
          />
        ))}
        <Pressable
          accessibilityLabel="Adicionar tópico"
          onPress={() => {
            mut.addTopico.mutate({
              disciplinaId: disc.id,
              nome: 'Novo tópico',
              ordem: disc.topicos.length,
              assuntoId: null,
            });
          }}
        >
          <Text style={{ color: c('primary') }}>+ tópico</Text>
        </Pressable>

        {disc.assuntos.map((a) => (
          <View
            key={a.id}
            style={{
              gap: 8,
              borderLeftColor: c('border'),
              borderLeftWidth: 2,
              paddingLeft: 10,
            }}
          >
            <LinhaEditavel
              label="Assunto"
              valorInicial={a.nome}
              onSalvar={(v) => mut.updateAssunto.mutate({ id: a.id, nome: v })}
              onRemover={() => mut.deleteAssunto.mutate({ id: a.id })}
            />
            {a.topicos.map((t) => (
              <LinhaEditavel
                key={t.id}
                label="Tópico"
                valorInicial={t.nome}
                onSalvar={(v) => mut.updateTopico.mutate({ id: t.id, patch: { nome: v } })}
                onRemover={() => mut.deleteTopico.mutate({ id: t.id })}
              />
            ))}
            <Pressable
              accessibilityLabel={`Adicionar tópico em ${a.nome}`}
              onPress={() =>
                mut.addTopico.mutate({
                  disciplinaId: disc.id,
                  nome: 'Novo tópico',
                  ordem: a.topicos.length,
                  assuntoId: a.id,
                })
              }
            >
              <Text style={{ color: c('primary') }}>+ tópico</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          accessibilityLabel="Adicionar assunto"
          onPress={() =>
            mut.addAssunto.mutate({
              disciplinaId: disc.id,
              nome: 'Novo assunto',
              ordem: disc.assuntos.length,
            })
          }
        >
          <Text style={{ color: c('primary') }}>+ assunto</Text>
        </Pressable>

        <View style={{ marginTop: 16 }}>
          <Button
            label="Remover disciplina"
            variant="danger"
            loading={mut.deleteDisciplina.isPending}
            onPress={async () => {
              try {
                await mut.deleteDisciplina.mutateAsync({ id: disc.id });
                toast.sucesso('Disciplina removida.');
                router.back();
              } catch {
                // erro já exibido pelo MutationCache global
              }
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CampoNome({
  label,
  valorInicial,
  onSalvar,
}: {
  label: string;
  valorInicial: string;
  onSalvar: (valor: string) => void;
}) {
  const [txt, setTxt] = useState(valorInicial);
  return (
    <Input
      label={label}
      value={txt}
      onChangeText={setTxt}
      onBlur={() => {
        const t = txt.trim();
        if (t && t !== valorInicial) onSalvar(t);
      }}
    />
  );
}

function LinhaEditavel({
  label,
  valorInicial,
  onSalvar,
  onRemover,
}: {
  label: string;
  valorInicial: string;
  onSalvar: (valor: string) => void;
  onRemover: () => void;
}) {
  const { c } = useTheme();
  const [txt, setTxt] = useState(valorInicial);
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
      <View style={{ flex: 1 }}>
        <Input
          label={label}
          value={txt}
          onChangeText={setTxt}
          onBlur={() => {
            const t = txt.trim();
            if (t && t !== valorInicial) onSalvar(t);
          }}
        />
      </View>
      <Pressable
        accessibilityLabel={`Remover ${valorInicial}`}
        onPress={onRemover}
        style={{ padding: 12 }}
      >
        <Text style={{ color: c('danger') }}>✕</Text>
      </Pressable>
    </View>
  );
}
