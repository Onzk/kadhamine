import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';
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
    accent: LightTheme.accent,
    accentForeground: LightTheme.onAccent,
    destructive: LightTheme.error,
    border: LightTheme.border,
    input: LightTheme.surfaceStrong,
    ring: LightTheme.focus,
    radius: '1rem',
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
    accent: AppDark.accent,
    accentForeground: AppDark.onAccent,
    destructive: AppDark.error,
    border: AppDark.border,
    input: AppDark.surfaceStrong,
    ring: AppDark.focus,
    radius: '1rem',
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
      primary: BrandColors.blue,
      text: THEME.light.foreground,
    },
    fonts: {
      bold: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
      medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
      regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
      heavy: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
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
      bold: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
      medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
      regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
      heavy: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    },
  },
};
