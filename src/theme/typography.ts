export const Fonts = {
  regular: 'SofiaSans_400Regular',
  medium: 'SofiaSans_500Medium',
  bold: 'SofiaSans_700Bold',
  /** Aliases for one-font system */
  display: 'SofiaSans_500Medium',
  displayMedium: 'SofiaSans_500Medium',
  body: 'SofiaSans_400Regular',
  bodyMedium: 'SofiaSans_500Medium',
  mono: 'SofiaSans_400Regular',
} as const;

export type FontRole = 'display' | 'body' | 'mono';

export function fontFamily(
  role: FontRole = 'body',
  weight: 'regular' | 'medium' | 'bold' = 'regular',
) {
  if (weight === 'bold') return Fonts.bold;
  if (role === 'display') {
    return weight === 'medium' ? Fonts.medium : Fonts.medium;
  }
  if (role === 'mono') return Fonts.regular;
  return weight === 'medium' ? Fonts.medium : Fonts.regular;
}

/** Mobile-scaled type scale from DESIGN.md */
export const TypeScale = {
  heroDisplay: {
    fontFamily: Fonts.medium,
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
    fontWeight: '500' as const,
  },
  productDisplay: {
    fontFamily: Fonts.medium,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.64,
    fontWeight: '500' as const,
  },
  sectionHeading: {
    fontFamily: Fonts.medium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
    fontWeight: '500' as const,
  },
  cardHeading: {
    fontFamily: Fonts.medium,
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.48,
    fontWeight: '500' as const,
  },
  featureHeading: {
    fontFamily: Fonts.medium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    lineHeight: 25.2,
    letterSpacing: -0.09,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: -0.08,
  },
  button: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: -0.48,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 18.2,
    letterSpacing: 0,
  },
  eyebrow: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0.56,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
  },
  monoLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.48,
    textTransform: 'uppercase' as const,
  },
  micro: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0,
  },
} as const;

export type TypeScaleRole = keyof typeof TypeScale;

export function textStyle(role: TypeScaleRole) {
  return TypeScale[role];
}
