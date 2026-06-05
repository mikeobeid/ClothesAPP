import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#FBF7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F0EE',
  primary: '#9B7B7B',
  primaryDark: '#7D6363',
  primaryLight: '#F3E8E8',
  accent: '#C9A9A6',
  accentSoft: '#E8D5D2',
  text: '#3D3435',
  textSecondary: '#7A6E6F',
  textMuted: '#A89B9C',
  border: '#EDE5E3',
  borderLight: '#F3EBE9',
  error: '#C97B7B',
  success: '#8FA68E',
  shadow: '#3D3435',
  favorite: '#C97878',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 999,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.text,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.text,
  },
  subheading: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 13,
    color: colors.textMuted,
  },
};

export const cardShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

export const cardBase: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.borderLight,
  ...cardShadow,
};
