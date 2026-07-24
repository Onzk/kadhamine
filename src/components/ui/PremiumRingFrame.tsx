import { Crown } from 'phosphor-react-native';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/providers/ThemeProvider';

type PremiumRingFrameProps = {
  /** Diameter of the circular content (avatar / logo). */
  size: number;
  isPremium?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Content background when not filled by children. */
  backgroundColor?: string;
  /** Thin border when not premium (profile avatars). */
  hairline?: boolean;
};

/** Angle of the crown from the top of the ring, towards the left. */
const CROWN_ANGLE_DEG = 32;

/**
 * Circular frame with optional premium red ring + tilted crown.
 * The crown is absolutely positioned (no layout impact) on the ring
 * circumference — upper-left, with a gap so it never touches the ring.
 */
export function PremiumRingFrame({
  size,
  isPremium = false,
  children,
  style,
  backgroundColor,
  hairline = false,
}: PremiumRingFrameProps) {
  const { colors } = useAppTheme();

  const ringWidth = size >= 96 ? 3 : size >= 64 ? 2.5 : 2;
  const gap = Math.max(4, Math.round(size * 0.06));
  const crownSize = Math.max(14, Math.min(30, Math.round(size * 0.26)));

  const theta = (CROWN_ANGLE_DEG * Math.PI) / 180;
  const orbit = size / 2 + gap + crownSize / 2;
  const crownLeft = size / 2 - orbit * Math.sin(theta) - crownSize / 2;
  const crownTop = size / 2 - orbit * Math.cos(theta) - crownSize / 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          position: 'relative',
        },
        style,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          borderWidth: isPremium ? ringWidth : hairline ? 0.1 : 0,
          borderColor: isPremium ? colors.accent : colors.borderHairline,
        }}
      >
        {children}
      </View>
      {isPremium ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: crownLeft,
            top: crownTop,
            width: crownSize,
            height: crownSize,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: `-${CROWN_ANGLE_DEG}deg` }],
          }}
        >
          <Crown size={crownSize} color={colors.accent} weight="fill" />
        </View>
      ) : null}
    </View>
  );
}
