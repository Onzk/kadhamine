import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { NativeOnlyAnimatedView } from '@/components/rn-ui/native-only-animated-view';
import { Motion, type MotionVariant } from '@/theme/motion';

type EnterProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Kind of enter animation. Default `item`. */
  variant?: MotionVariant;
  /** Stagger index for section / item / card. */
  index?: number;
};

/**
 * Apparition fluide native (no-op web) — pages, listes, cards.
 */
export function Enter({ children, style, variant = 'item', index = 0 }: EnterProps) {
  const stagger = Number.isFinite(index) ? Math.max(0, index) : 0;
  const entering =
    variant === 'page'
      ? Motion.page()
      : variant === 'fade'
        ? Motion.fade(0)
        : Motion[variant](stagger);

  return (
    <NativeOnlyAnimatedView entering={entering} style={style}>
      {children}
    </NativeOnlyAnimatedView>
  );
}
