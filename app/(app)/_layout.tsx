import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

const tabIcon = (name: React.ComponentProps<typeof Ionicons>['name']) => {
  function TabBarIcon({ color, size }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={name} color={color} size={size} />;
  }
  return TabBarIcon;
};

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
      <Tabs.Screen name="index" options={{ title: 'Painel', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="edital/index" options={{ title: 'Edital', tabBarIcon: tabIcon('list') }} />
      <Tabs.Screen name="revisar" options={{ title: 'Revisar', tabBarIcon: tabIcon('repeat') }} />
      <Tabs.Screen
        name="ajustes"
        options={{ title: 'Ajustes', tabBarIcon: tabIcon('settings-outline') }}
      />
      <Tabs.Screen name="edital/disciplina/[id]" options={{ href: null }} />
      <Tabs.Screen name="edital/topico/[id]" options={{ href: null }} />
    </Tabs>
  );
}
