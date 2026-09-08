import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button, Input, useToast } from '@/components/ui';
import { useSession } from '@/features/auth/useSession';
import type { AppError } from '@/lib/errors';

export default function SignUp() {
  const { signUp } = useSession();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    setErro(undefined);
    setCarregando(true);
    try {
      await signUp(email.trim(), senha);
      toast.sucesso('Conta criada! Verifique seu e-mail se necessário.');
      router.replace('/(auth)/sign-in');
    } catch (e) {
      setErro((e as AppError).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>Criar conta</Text>
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input label="Senha" value={senha} onChangeText={setSenha} secureTextEntry error={erro} />
      <Button label="Cadastrar" onPress={cadastrar} loading={carregando} />
      <Link href="/(auth)/sign-in">
        <Text>Já tem conta? Entrar</Text>
      </Link>
    </View>
  );
}
