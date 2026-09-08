import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Card({ style, ...rest }: ViewProps) {
  const { c } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: c('surface'),
          borderColor: c('border'),
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
        },
        style,
      ]}
    />
  );
}
