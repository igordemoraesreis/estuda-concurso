import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Input({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  keyboardType,
  secureTextEntry,
  multiline,
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: c('muted'), fontSize: 14 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={c('muted')}
        autoCapitalize={autoCapitalize}
        style={{
          color: c('text'),
          borderColor: error ? c('danger') : c('border'),
          borderWidth: 1,
          borderRadius: 10,
          padding: 12,
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error ? <Text style={{ color: c('danger'), fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}
