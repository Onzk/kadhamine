import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/theme/tokens';

/** Insets safe area — utile pour footers fixes ou contenus spéciaux. */
export function useScreenInsets() {
  return useSafeAreaInsets();
}

/** Padding bas ScrollView (safe area déjà appliquée par AppSafeArea à la racine). */
export function useScrollBottomPadding(extra = Spacing.six) {
  return extra;
}
