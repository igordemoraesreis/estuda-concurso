import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Input, ProgressBar, Stat } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { hojeISO, formatarDataBR } from '@/lib/date';
import { sessaoExercicioSchema } from './schema';
import { useExercicioMutations, useSessoesExercicio } from './hooks';
import type { SessaoExercicioRow } from './api';

function paraNumero(texto: string): number {
  const t = texto.trim();
  if (t === '') return 0;
  return Number(t);
}

function pct(acertos: number, total: number): number {
  return total > 0 ? Math.round((acertos / total) * 100) : 0;
}

type Erros = Partial<Record<'data' | 'acertos' | 'erros' | 'nota', string>>;

export function SessoesExercicio({
  topicoId,
  concursoId,
}: {
  topicoId: string;
  concursoId: string | null;
}) {
  const { c } = useTheme();
  const { data: sessoes } = useSessoesExercicio(topicoId);
  const { adicionar, remover } = useExercicioMutations(concursoId, topicoId);

  const [acertos, setAcertos] = useState('');
  const [erros, setErros] = useState('');
  const [data, setData] = useState(hojeISO());
  const [nota, setNota] = useState('');
  const [errs, setErrs] = useState<Erros>({});

  const lista = sessoes ?? [];
  const totalAcertos = lista.reduce((s, x) => s + x.acertos, 0);
  const totalQuestoes = lista.reduce((s, x) => s + x.acertos + x.erros, 0);
  const taxaTopico = pct(totalAcertos, totalQuestoes);

  function registrar() {
    const candidato = {
      data,
      acertos: paraNumero(acertos),
      erros: paraNumero(erros),
      nota: nota.trim() === '' ? undefined : nota,
    };
    const parsed = sessaoExercicioSchema.safeParse(candidato);
    if (!parsed.success) {
      const novo: Erros = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0] as keyof Erros;
        if (campo && !novo[campo]) novo[campo] = issue.message;
      }
      setErrs(novo);
      return;
    }
    setErrs({});
    adicionar.mutate(parsed.data, {
      onSuccess: () => {
        setAcertos('');
        setErros('');
        setNota('');
        setData(hojeISO());
      },
    });
  }

  return (
    <Card style={{ gap: 16 }}>
      <Text style={{ color: c('text'), fontSize: 18, fontWeight: '700' }}>Exercícios</Text>

      <Stat
        rotulo="Aproveitamento acumulado (%)"
        valor={totalQuestoes > 0 ? String(taxaTopico) : '—'}
        sub={`${totalAcertos} de ${totalQuestoes} questões`}
      />
      <ProgressBar value={totalQuestoes > 0 ? totalAcertos / totalQuestoes : 0} />

      <View style={{ height: 1, backgroundColor: c('border') }} />

      <Input
        label="Acertos"
        value={acertos}
        onChangeText={setAcertos}
        keyboardType="number-pad"
        placeholder="Ex.: 8"
        error={errs.acertos}
      />
      <Input
        label="Erros"
        value={erros}
        onChangeText={setErros}
        keyboardType="number-pad"
        placeholder="Ex.: 2"
        error={errs.erros}
      />
      <Input
        label="Data (AAAA-MM-DD)"
        value={data}
        onChangeText={setData}
        placeholder={hojeISO()}
        error={errs.data}
      />
      <Input
        label="Nota (opcional)"
        value={nota}
        onChangeText={setNota}
        placeholder="Comentário sobre a sessão"
        error={errs.nota}
      />
      <Button label="Registrar exercícios" onPress={registrar} loading={adicionar.isPending} />

      <View style={{ height: 1, backgroundColor: c('border') }} />

      <Text style={{ color: c('text'), fontWeight: '600' }}>Sessões</Text>
      {lista.length === 0 ? (
        <Text style={{ color: c('muted') }}>Nenhuma sessão registrada ainda.</Text>
      ) : (
        lista.map((s: SessaoExercicioRow) => {
          const total = s.acertos + s.erros;
          return (
            <View
              key={s.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: c('text') }}>{formatarDataBR(s.data)}</Text>
              <Text style={{ color: c('muted') }}>
                {s.acertos}/{total} ({pct(s.acertos, total)}%)
              </Text>
              <Button
                label="Remover"
                variant="ghost"
                onPress={() => remover.mutate(s.id)}
              />
            </View>
          );
        })
      )}
    </Card>
  );
}
