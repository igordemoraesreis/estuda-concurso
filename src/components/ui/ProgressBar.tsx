import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function ProgressBar({ value, testID }: { value: number; testID?: string }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      testID={testID}
      style={{
        height: 8,
        borderRadius: 9999,
        backgroundColor: c('border'),
        overflow: 'hidden',
      }}
    >
      <View
        testID={testID ? `${testID}-fill` : undefined}
        style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c('primary') }}
      />
    </View>
  );
}
