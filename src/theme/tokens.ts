/**
 * Design tokens TalentTchad — source de vérité : DESIGN.md (Mastercard-inspired).
 * Logo blue/gold/crimson réservés aux assets de marque et badges sémantiques.
 */

export const BrandColors = {
  /** Logo only — not a marketing CTA color */
  blue: '#0B3D91',
  /** Verified check / rating */
  gold: '#F5C400',
  /** Premium / danger semantic */
  crimson: '#E11D48',
  ink: '#141413',
  black: '#141413',
  canvas: '#F3F0EE',
  lifted: '#FCFBFA',
  signal: '#CF4500',
  orbit: '#F37338',
  clay: '#9A3A0A',
  dust: '#D1CDC7',
  link: '#3860BE',
  /** @deprecated alias → ink */
  nearBlack: '#141413',
  /** @deprecated */
  enterpriseGreen: '#141413',
  darkNavy: '#141413',
  /** @deprecated alias → ink */
  actionBlue: '#141413',
  /** @deprecated alias → crimson */
  coral: '#E11D48',
  /** @deprecated alias → gold */
  softCoral: '#F5C400',
} as const;

export const LightTheme = {
  canvas: '#F3F0EE',
  canvasSoft: '#FCFBFA',
  canvasGreenWash: '#E8E2DA',
  canvasBlueWash: '#E8E2DA',
  surface: '#FCFBFA',
  surfaceCard: '#FCFBFA',
  surfaceStrong: '#E8E2DA',
  surfaceDark: BrandColors.ink,
  surfaceNavy: BrandColors.ink,
  iconWash: '#E8E2DA',
  border: '#D1CDC7',
  borderHairline: '#D1CDC7',
  borderLight: '#E8E2DA',
  ink: '#141413',
  body: '#141413',
  muted: '#696969',
  slate: '#555555',
  dust: '#D1CDC7',
  primary: BrandColors.ink,
  primaryActive: '#262627',
  accent: BrandColors.crimson,
  accentSoft: BrandColors.gold,
  signal: BrandColors.signal,
  orbit: BrandColors.orbit,
  clay: BrandColors.clay,
  link: BrandColors.link,
  onPrimary: '#F3F0EE',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  success: '#027A48',
  warning: BrandColors.gold,
  error: BrandColors.crimson,
  info: BrandColors.link,
  focus: BrandColors.ink,
  focusInput: BrandColors.ink,
  switchTrackOff: '#D1CDC7',
  switchTrackOn: BrandColors.ink,
  rating: BrandColors.gold,
} as const;

export const DarkTheme = {
  canvas: '#141413',
  canvasSoft: '#1C1C1B',
  canvasGreenWash: '#262627',
  canvasBlueWash: '#262627',
  surface: '#1C1C1B',
  surfaceCard: '#262627',
  surfaceStrong: '#333332',
  surfaceDark: '#0A0A09',
  surfaceNavy: '#0A0A09',
  iconWash: '#333332',
  border: '#3A3A38',
  borderHairline: '#3A3A38',
  borderLight: '#262627',
  ink: '#F3F0EE',
  body: '#F3F0EE',
  muted: '#A3A09A',
  slate: '#8A8680',
  dust: '#555555',
  primary: '#F3F0EE',
  primaryActive: '#E8E2DA',
  accent: BrandColors.crimson,
  accentSoft: BrandColors.gold,
  signal: BrandColors.signal,
  orbit: BrandColors.orbit,
  clay: '#F37338',
  link: '#7B9BE0',
  onPrimary: '#141413',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  success: '#6CE9A6',
  warning: BrandColors.gold,
  error: '#FDA29B',
  info: '#7B9BE0',
  focus: '#F3F0EE',
  focusInput: '#F3F0EE',
  switchTrackOff: '#3A3A38',
  switchTrackOn: '#F3F0EE',
  rating: BrandColors.gold,
} as const;

export type ThemeColors = typeof LightTheme | typeof DarkTheme;

/** 8px grid — DESIGN.md spacing scale */
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
  six: 24,
  seven: 24,
  eight: 32,
  nine: 32,
  ten: 40,
  eleven: 40,
  twelve: 48,
  thirteen: 56,
  fourteen: 64,
  fifteen: 80,
  sixteen: 96,
  seventeen: 128,
} as const;

/**
 * Radius scale — DESIGN.md: tiny (≤6), button (20), consent (24), stadium (40), pill (999+).
 * Mid-range 8–16 intentionally avoided.
 */
export const Radius = {
  xs: 6,
  sm: 6,
  md: 20,
  lg: 20,
  xl: 40,
  button: 20,
  consent: 24,
  stadium: 40,
  pill: 999,
  full: 9999,
} as const;

export const MaxContentWidth = 800;

export const Shadows = {
  nav: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 24 },
    elevation: 4,
  },
  /** FAB Flutter Material — élévation 6 au repos. */
  fab: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  /** FAB Flutter Material — élévation 12 au pressé. */
  fabPressed: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
} as const;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
