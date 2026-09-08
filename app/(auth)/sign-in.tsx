import { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Button, Input, useToast } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useSession } from '@/features/auth/useSession';
import type { AppError } from '@/lib/errors';

export default function SignIn() {
  const { c } = useTheme();
  const { signInWithPassword, signInWithGoogle } = useSession();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(undefined);
    setCarregando(true);
    try {
      await signInWithPassword(email.trim(), senha);
    } catch (e) {
      setErro((e as AppError).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ color: c('text'), fontSize: 26, fontWeight: '700' }}>Entrar</Text>
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input label="Senha" value={senha} onChangeText={setSenha} secureTextEntry error={erro} />
        <Button label="Entrar" onPress={entrar} loading={carregando} />
        <Button
          label="Entrar com Google"
          variant="secondary"
          onPress={() => signInWithGoogle().catch((e) => toast.erro((e as AppError).message))}
        />
        <Link href="/(auth)/sign-up">
          <Text style={{ color: c('muted') }}>Não tem conta? Cadastre-se</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
