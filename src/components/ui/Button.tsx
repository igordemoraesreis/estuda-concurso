import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const bg = {
    primary: c('primary'),
    danger: c('danger'),
    secondary: c('surface'),
    ghost: 'transparent',
  }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? c('text') : '#FFFFFF';
  const inativo = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      onPress={onPress}
      style={{
        backgroundColor: bg,
        opacity: inativo ? 0.6 : 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
      }}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '600' }}>{label}</Text>
      )}
    </Pressable>
  );
}
