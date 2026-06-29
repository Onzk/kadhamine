export const BrandColors = {
  blue: '#002664',
  blueLight: '#003d99',
  blueDark: '#001a4d',
  yellow: '#FECB00',
  yellowLight: '#FFE566',
  red: '#C60C30',
  redLight: '#E8354F',
} as const;

export const LightTheme = {
  canvas: '#F8F9FC',
  canvasSoft: '#EEF2F7',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceStrong: '#E8EDF5',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  ink: '#0F172A',
  body: '#475569',
  muted: '#94A3B8',
  primary: BrandColors.blue,
  primaryActive: BrandColors.blueDark,
  accent: BrandColors.yellow,
  onPrimary: '#FFFFFF',
  onAccent: BrandColors.blueDark,
  success: '#16A34A',
  warning: BrandColors.yellow,
  error: BrandColors.red,
  info: BrandColors.blue,
} as const;

export const DarkTheme = {
  canvas: '#0A0E1A',
  canvasSoft: '#111827',
  surface: '#141B2D',
  surfaceCard: '#1A2235',
  surfaceStrong: '#243049',
  border: '#2A3548',
  borderStrong: '#3D4F6F',
  ink: '#F1F5F9',
  body: '#CBD5E1',
  muted: '#64748B',
  primary: '#3B82F6',
  primaryActive: '#2563EB',
  accent: BrandColors.yellow,
  onPrimary: '#FFFFFF',
  onAccent: BrandColors.blueDark,
  success: '#22C55E',
  warning: BrandColors.yellow,
  error: '#EF4444',
  info: '#60A5FA',
} as const;

export type ThemeColors = typeof LightTheme | typeof DarkTheme;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  eight: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const MaxContentWidth = 800;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
