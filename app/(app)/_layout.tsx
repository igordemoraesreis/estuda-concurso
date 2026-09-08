import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c('primary'),
        tabBarInactiveTintColor: c('muted'),
        tabBarStyle: { backgroundColor: c('bg'), borderTopColor: c('border') },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="edital/index" options={{ title: 'Edital' }} />
      <Tabs.Screen name="revisar" options={{ title: 'Revisar' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      <Tabs.Screen name="edital/disciplina/[id]" options={{ href: null }} />
      <Tabs.Screen name="edital/topico/[id]" options={{ href: null }} />
    </Tabs>
  );
}
