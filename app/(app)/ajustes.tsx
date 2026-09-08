import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useSession } from '@/features/auth/useSession';
import { useProfile, useUpdateSettings } from '@/features/settings/hooks';
import { TrocarConcurso } from '@/features/concurso/TrocarConcurso';

type TemaValor = 'system' | 'light' | 'dark';

const TEMAS: { valor: TemaValor; rotulo: string }[] = [
  { valor: 'system', rotulo: 'Sistema' },
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
];

const LIMIARES_PADRAO = [7, 15, 30];
const LABELS_LIMIAR = ['1ª revisão (dias)', '2ª revisão (dias)', '3ª revisão (dias)'];

export default function Ajustes() {
  const { c, setOverride } = useTheme();
  const { session, signOut } = useSession();
  const userId = session?.user.id ?? null;
  const { data: profile } = useProfile(userId);
  const updateSettings = useUpdateSettings(userId);

  const tema: TemaValor = profile?.settings?.tema ?? 'system';
  const limiares = profile?.settings?.limiaresRevisaoDias ?? LIMIARES_PADRAO;
  const [editado, setEditado] = useState<string[] | null>(null);
  const limiaresTexto = editado ?? limiares.map((n) => String(n));

  function trocarTema(valor: TemaValor) {
    setOverride(valor);
    updateSettings.mutate({ tema: valor });
  }

  function editarLimiar(indice: number, texto: string) {
    const proximo = limiaresTexto.map((v, i) => (i === indice ? texto : v));
    setEditado(proximo);
    const nums = proximo.map((v) => Number.parseInt(v, 10));
    if (nums.length !== 3 || nums.some((n) => Number.isNaN(n) || n <= 0)) return;
    updateSettings.mutate({
      limiaresRevisaoDias: [nums[0], nums[1], nums[2]].sort((x, y) => x - y),
    });
  }

  const tituloStyle = { color: c('text'), fontSize: 16, fontWeight: '700' } as const;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ color: c('text'), fontSize: 22, fontWeight: '700' }}>Ajustes</Text>

        <Card style={{ gap: 12 }}>
          <Text style={tituloStyle}>Conta</Text>
          <Text style={{ color: c('muted'), fontSize: 12 }}>Nome de exibição</Text>
          <Text style={{ color: c('text'), fontWeight: '600' }}>
            {profile?.display_name ?? '—'}
          </Text>
          <Button label="Sair" variant="danger" onPress={signOut} />
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={tituloStyle}>Aparência</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TEMAS.map((t) => (
              <View key={t.valor} style={{ flex: 1 }}>
                <Button
                  label={t.rotulo}
                  variant={tema === t.valor ? 'primary' : 'secondary'}
                  onPress={() => trocarTema(t.valor)}
                />
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={tituloStyle}>Revisão</Text>
          <Text style={{ color: c('muted'), fontSize: 12 }}>
            Dias após concluir um tópico para ele voltar à fila de revisão.
          </Text>
          {LABELS_LIMIAR.map((label, i) => (
            <Input
              key={label}
              label={label}
              value={limiaresTexto[i] ?? ''}
              onChangeText={(t) => editarLimiar(i, t)}
              keyboardType="numeric"
            />
          ))}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={tituloStyle}>Concursos</Text>
          <TrocarConcurso activeConcursoId={profile?.active_concurso_id ?? null} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
