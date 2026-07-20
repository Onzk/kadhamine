/**
 * Design tokens TalentTchad — palette dérivée du logo + patterns docs/design.png
 * Source de vérité unique (CDC §9). Ne pas inventer de hex hors de ce fichier.
 */

export const BrandColors = {
  /** Bleu logo / primary brand */
  blue: '#0B3D91',
  /** Check doré / verified */
  gold: '#F5C400',
  /** Étoile rouge / accent */
  crimson: '#E11D48',
  ink: '#101828',
  black: '#000000',
  /** @deprecated alias → blue */
  nearBlack: '#101828',
  /** @deprecated alias → blue (anciennement green Cohere) */
  enterpriseGreen: '#0B3D91',
  darkNavy: '#071829',
  /** @deprecated alias → blue */
  actionBlue: '#0B3D91',
  /** @deprecated alias → crimson */
  coral: '#E11D48',
  /** @deprecated alias → gold */
  softCoral: '#F5C400',
} as const;

export const LightTheme = {
  canvas: '#FFFFFF',
  canvasSoft: '#F2F4F7',
  canvasGreenWash: '#EAF0FB',
  canvasBlueWash: '#EAF0FB',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceStrong: '#F2F4F7',
  surfaceDark: BrandColors.blue,
  surfaceNavy: BrandColors.darkNavy,
  iconWash: '#EAF0FB',
  border: '#E5E7EB',
  borderHairline: '#E5E7EB',
  borderLight: '#F2F4F7',
  ink: '#101828',
  body: '#344054',
  muted: '#667085',
  slate: '#98A2B3',
  primary: BrandColors.blue,
  primaryActive: '#082E6E',
  accent: BrandColors.crimson,
  accentSoft: BrandColors.gold,
  link: BrandColors.blue,
  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  success: '#027A48',
  warning: BrandColors.gold,
  error: BrandColors.crimson,
  info: BrandColors.blue,
  focus: BrandColors.blue,
  focusInput: BrandColors.blue,
  switchTrackOff: '#E5E7EB',
  switchTrackOn: BrandColors.blue,
  rating: BrandColors.gold,
} as const;

export const DarkTheme = {
  canvas: '#0A1628',
  canvasSoft: '#122038',
  canvasGreenWash: '#122038',
  canvasBlueWash: '#122038',
  surface: '#122038',
  surfaceCard: '#1A2B45',
  surfaceStrong: '#243552',
  surfaceDark: BrandColors.blue,
  surfaceNavy: BrandColors.darkNavy,
  iconWash: '#1E3354',
  border: '#2A3F5F',
  borderHairline: '#2A3F5F',
  borderLight: '#243552',
  ink: '#F9FAFB',
  body: '#E4E7EC',
  muted: '#98A2B3',
  slate: '#667085',
  primary: '#5B8DEF',
  primaryActive: '#7BA3F5',
  accent: BrandColors.crimson,
  accentSoft: BrandColors.gold,
  link: '#7BA3F5',
  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  success: '#6CE9A6',
  warning: BrandColors.gold,
  error: '#FDA29B',
  info: '#7BA3F5',
  focus: '#7BA3F5',
  focusInput: '#7BA3F5',
  switchTrackOff: '#2A3F5F',
  switchTrackOn: BrandColors.blue,
  rating: BrandColors.gold,
} as const;

export type ThemeColors = typeof LightTheme | typeof DarkTheme;

export const Spacing = {
  px: 1,
  half: 2,
  one: 4,
  oneHalf: 6,
  two: 8,
  twoHalf: 10,
  three: 12,
  four: 16,
  five: 20,
  six: 22,
  seven: 24,
  eight: 28,
  nine: 32,
  ten: 36,
  eleven: 40,
  twelve: 56,
  thirteen: 60,
  fourteen: 64,
  fifteen: 80,
} as const;

/** Coins très arrondis — patterns design.png (16–24) */
export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 9999,
  full: 9999,
} as const;

export const MaxContentWidth = 800;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
