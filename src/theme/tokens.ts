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
  canvas: '#F5F5F5',
  canvasSoft: '#EFEFEF',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceStrong: '#F0F0F0',
  border: '#E8E8E8',
  borderStrong: '#D4D4D4',
  ink: '#0A0A0A',
  body: '#4A4A4A',
  muted: '#8A8A8A',
  primary: '#0A0A0A',
  primaryActive: '#262626',
  accent: BrandColors.yellow,
  onPrimary: '#FFFFFF',
  onAccent: BrandColors.blueDark,
  success: '#27AE60',
  warning: BrandColors.yellow,
  error: BrandColors.red,
  info: BrandColors.blue,
  switchTrackOff: '#E8E8E8',
  switchTrackOn: '#0A0A0A',
} as const;

export const DarkTheme = {
  canvas: '#0A0A0A',
  canvasSoft: '#141414',
  surface: '#1A1A1A',
  surfaceCard: '#1F1F1F',
  surfaceStrong: '#2A2A2A',
  border: '#2E2E2E',
  borderStrong: '#404040',
  ink: '#F5F5F5',
  body: '#B0B0B0',
  muted: '#737373',
  primary: '#F5F5F5',
  primaryActive: '#E5E5E5',
  accent: BrandColors.yellow,
  onPrimary: '#0A0A0A',
  onAccent: BrandColors.blueDark,
  success: '#2ECC71',
  warning: BrandColors.yellow,
  error: '#EF4444',
  info: '#60A5FA',
  switchTrackOff: '#404040',
  switchTrackOn: '#F5F5F5',
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
