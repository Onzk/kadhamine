import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { BrandColors, DarkTheme as AppDark, LightTheme } from '@/theme/tokens';

export const THEME = {
  light: {
    background: LightTheme.canvas,
    foreground: LightTheme.ink,
    card: LightTheme.surfaceCard,
    cardForeground: LightTheme.ink,
    popover: LightTheme.canvas,
    popoverForeground: LightTheme.ink,
    primary: LightTheme.primary,
    primaryForeground: LightTheme.onPrimary,
    secondary: LightTheme.surfaceStrong,
    secondaryForeground: LightTheme.ink,
    muted: LightTheme.muted,
    mutedForeground: LightTheme.muted,
    accent: LightTheme.signal,
    accentForeground: LightTheme.onAccent,
    destructive: LightTheme.error,
    border: LightTheme.border,
    input: '#FFFFFF',
    ring: LightTheme.focus,
    radius: '20px',
  },
  dark: {
    background: AppDark.canvas,
    foreground: AppDark.ink,
    card: AppDark.surfaceCard,
    cardForeground: AppDark.ink,
    popover: AppDark.surfaceCard,
    popoverForeground: AppDark.ink,
    primary: AppDark.primary,
    primaryForeground: AppDark.onPrimary,
    secondary: AppDark.surfaceStrong,
    secondaryForeground: AppDark.ink,
    muted: AppDark.muted,
    mutedForeground: AppDark.muted,
    accent: AppDark.signal,
    accentForeground: AppDark.onAccent,
    destructive: AppDark.error,
    border: AppDark.border,
    input: AppDark.surfaceStrong,
    ring: AppDark.focus,
    radius: '20px',
  },
} as const;

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: BrandColors.ink,
      text: THEME.light.foreground,
    },
    fonts: {
      bold: { fontFamily: 'SofiaSans_700Bold', fontWeight: '700' },
      medium: { fontFamily: 'SofiaSans_500Medium', fontWeight: '500' },
      regular: { fontFamily: 'SofiaSans_400Regular', fontWeight: '400' },
      heavy: { fontFamily: 'SofiaSans_700Bold', fontWeight: '700' },
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
    fonts: {
      bold: { fontFamily: 'SofiaSans_700Bold', fontWeight: '700' },
      medium: { fontFamily: 'SofiaSans_500Medium', fontWeight: '500' },
      regular: { fontFamily: 'SofiaSans_400Regular', fontWeight: '400' },
      heavy: { fontFamily: 'SofiaSans_700Bold', fontWeight: '700' },
    },
  },
};
