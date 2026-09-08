import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Input } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { hojeISO, formatarDataBR } from '@/lib/date';
import { useTimer, segundosDecorridos } from './timerStore';
import { formatarMMSS } from './TimerPill';
import { useEstudoMutations, useSessoesEstudo } from './hooks';
import type { SessaoEstudoRow } from './api';

function formatarDuracao(segundos: number): string {
  const min = Math.round(segundos / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function SessoesEstudo({
  topicoId,
  concursoId,
  topicoNome = 'Estudo',
}: {
  topicoId: string;
  concursoId: string | null;
  topicoNome?: string;
}) {
  const { c } = useTheme();
  const [salvando, setSalvando] = useState(false);
  const status = useTimer((s) => s.status);
  const timerTopicoId = useTimer((s) => s.topicoId);
  const iniciadaEm = useTimer((s) => s.iniciadaEm);
  const acumulado = useTimer((s) => s.acumulado);

  const { salvarCronometro, salvarManual } = useEstudoMutations(concursoId, topicoId);
  const { data: sessoes } = useSessoesEstudo(topicoId);

  const [minutos, setMinutos] = useState('');
  const [data, setData] = useState(hojeISO());

  const nesteTopico = timerTopicoId === topicoId && status !== 'idle';
  const emOutroTopico = timerTopicoId !== null && timerTopicoId !== topicoId && status !== 'idle';
  const rodando = status === 'running';
  const segundos = segundosDecorridos({ status, iniciadaEm, acumulado });

  // O reset só acontece em `onSuccess`: se o save falhar, o cronômetro continua de pé
  // e o usuário pode tentar de novo em vez de perder a sessão.
  function salvarSessao(
    st: ReturnType<typeof useTimer.getState>,
    alvoTopicoId: string,
    depois?: () => void,
  ) {
    setSalvando(true);
    salvarCronometro.mutate(
      {
        topicoId: alvoTopicoId,
        iniciadaEm: new Date(st.sessaoIniciadaEm ?? st.iniciadaEm ?? Date.now()).toISOString(),
        duracaoSegundos: segundosDecorridos(st),
      },
      {
        onSuccess: () => {
          useTimer.getState().reset();
          depois?.();
        },
        // O toast de erro vem do `MutationCache` padrão (`src/lib/query.ts`); duplicar
        // aqui mostraria a mesma mensagem duas vezes. Em erro nada é resetado — o
        // cronômetro continua de pé e o usuário tenta de novo.
        onSettled: () => setSalvando(false),
      },
    );
  }

  function parar() {
    const st = useTimer.getState();
    if (salvando || st.status === 'idle') return; // guarda contra toque duplo
    salvarSessao(st, topicoId);
  }

  function pausarOutroEIniciar() {
    if (salvando) return;
    useTimer.getState().pause();
    const st = useTimer.getState();
    if (!st.topicoId) return;
    salvarSessao(st, st.topicoId, () => useTimer.getState().start(topicoId, topicoNome));
  }

  function registrarManual() {
    const min = Number(minutos.replace(',', '.'));
    if (!Number.isFinite(min) || min <= 0) return;
    salvarManual.mutate(
      { topicoId, data, duracaoSegundos: Math.round(min * 60) },
      { onSuccess: () => setMinutos('') },
    );
  }

  return (
    <Card style={{ gap: 16 }}>
      <Text style={{ color: c('text'), fontSize: 18, fontWeight: '700' }}>Cronômetro de estudo</Text>

      {nesteTopico ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: c('text'), fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {formatarMMSS(segundos)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={rodando ? 'Pausar' : 'Retomar'}
                variant="secondary"
                onPress={() =>
                  rodando ? useTimer.getState().pause() : useTimer.getState().resume()
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Parar" variant="danger" onPress={parar} disabled={salvando} />
            </View>
          </View>
        </View>
      ) : emOutroTopico ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: c('muted') }}>Cronômetro rodando em outro tópico</Text>
          <Button
            label="Salvar o outro e iniciar aqui"
            onPress={pausarOutroEIniciar}
            disabled={salvando}
          />
        </View>
      ) : (
        <Button
          label="Iniciar cronômetro"
          onPress={() => useTimer.getState().start(topicoId, topicoNome)}
        />
      )}

      <View style={{ height: 1, backgroundColor: c('border') }} />

      <Text style={{ color: c('text'), fontWeight: '600' }}>Registro manual</Text>
      <Input
        label="Minutos"
        value={minutos}
        onChangeText={setMinutos}
        keyboardType="number-pad"
        placeholder="Ex.: 45"
      />
      <Input label="Data (AAAA-MM-DD)" value={data} onChangeText={setData} placeholder={hojeISO()} />
      <Button label="Registrar tempo" onPress={registrarManual} />

      <View style={{ height: 1, backgroundColor: c('border') }} />

      <Text style={{ color: c('text'), fontWeight: '600' }}>Sessões</Text>
      {(sessoes ?? []).length === 0 ? (
        <Text style={{ color: c('muted') }}>Nenhuma sessão registrada ainda.</Text>
      ) : (
        (sessoes ?? []).map((s: SessaoEstudoRow) => (
          <View
            key={s.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: c('text') }}>{formatarDataBR(s.iniciada_em)}</Text>
            <Text style={{ color: c('muted') }}>{formatarDuracao(s.duracao_segundos)}</Text>
            <View
              style={{
                borderColor: c('border'),
                borderWidth: 1,
                borderRadius: 9999,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: c('muted'), fontSize: 12 }}>
                {s.origem === 'manual' ? 'manual' : 'cronômetro'}
              </Text>
            </View>
          </View>
        ))
      )}
    </Card>
  );
}
