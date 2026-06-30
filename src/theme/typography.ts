export const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export type FontWeight = keyof typeof Fonts;

export function fontFamily(weight: FontWeight = 'regular') {
  return Fonts[weight];
}
