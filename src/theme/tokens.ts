export const tokens = {
  colors: {
    bg: { light: '#FFFFFF', dark: '#0B0F14' },
    surface: { light: '#F4F6F8', dark: '#151B22' },
    border: { light: '#E2E6EA', dark: '#26313C' },
    text: { light: '#0B0F14', dark: '#F4F6F8' },
    muted: { light: '#5B6B78', dark: '#93A4B3' },
    primary: { light: '#2563EB', dark: '#3B82F6' },
    success: { light: '#16A34A', dark: '#22C55E' },
    danger: { light: '#DC2626', dark: '#EF4444' },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { sm: 6, md: 10, lg: 16, full: 9999 },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 20, xl: 26, '2xl': 34 },
} as const;

export type Tokens = typeof tokens;
