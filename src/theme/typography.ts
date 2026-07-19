export const Fonts = {
  display: 'SpaceGrotesk_400Regular',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  mono: 'SpaceGrotesk_400Regular',
} as const;

export type FontRole = 'display' | 'body' | 'mono';

export function fontFamily(role: FontRole = 'body', weight: 'regular' | 'medium' = 'regular') {
  if (role === 'display') {
    return weight === 'medium' ? Fonts.displayMedium : Fonts.display;
  }
  if (role === 'mono') return Fonts.mono;
  return weight === 'medium' ? Fonts.bodyMedium : Fonts.body;
}

/** Mobile-scaled type scale from DESIGN.md */
export const TypeScale = {
  heroDisplay: {
    fontFamily: Fonts.display,
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  productDisplay: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
  },
  sectionHeading: {
    fontFamily: Fonts.body,
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: -0.28,
  },
  cardHeading: {
    fontFamily: Fonts.body,
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.24,
  },
  featureHeading: {
    fontFamily: Fonts.body,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: Fonts.body,
    fontSize: 18,
    lineHeight: 25.2,
    letterSpacing: 0,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  button: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 19.6,
    letterSpacing: 0,
  },
  monoLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0.28,
    textTransform: 'uppercase' as const,
  },
  micro: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0,
  },
} as const;

export type TypeScaleRole = keyof typeof TypeScale;

export function textStyle(role: TypeScaleRole) {
  return TypeScale[role];
}
