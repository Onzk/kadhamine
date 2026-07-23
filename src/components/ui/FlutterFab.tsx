import React, { useState } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BrandColors } from '@/theme/tokens';

/**
 * Specs Flutter Material (FloatingActionButton / .extended) :
 * - hauteur 56 dp, coins 16 dp (M3)
 * - small : 40 dp, coins 12 dp
 * - extended : padding horizontal 20, gap icône↔label 8 dp
 * - élévation : 6 repos / 12 pressé / 0 disabled
 */

export const FLUTTER_FAB = {
  height: 56,
  small: 40,
  radius: 16,
  smallRadius: 12,
  iconSize: 24,
  smallIconSize: 24,
  iconGap: 8,
  hPadding: 20,
  edgeMargin: 16,
} as const;

type ElevationState = 'resting' | 'pressed' | 'disabled';

function elevationStyle(state: ElevationState) {
  if (state === 'disabled') {
    return {
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    };
  }
  if (state === 'pressed') {
    return {
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
    };
  }
  // resting — Material elevation 6
  return {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  };
}

export type FlutterExtendedFabProps = {
  /** Équivalent Flutter `onPressed`. */
  onPressed: (() => void) | null;
  label: string;
  /** React node (icône) ou symbole texte (ex. "+"). */
  icon?: React.ReactNode | string;
  backgroundColor?: string;
  foregroundColor?: string;
  disabled?: boolean;
  bottom?: number;
  right?: number;
  absolute?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Flutter `FloatingActionButton.extended` — icône à gauche + label.
 */
export function FlutterExtendedFab({
  onPressed,
  label,
  icon,
  backgroundColor = BrandColors.orbit,
  foregroundColor = '#FFFFFF',
  disabled = false,
  bottom = FLUTTER_FAB.edgeMargin,
  right = FLUTTER_FAB.edgeMargin,
  absolute = true,
  style,
  accessibilityLabel,
}: FlutterExtendedFabProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || onPressed == null;
  const elev = elevationStyle(isDisabled ? 'disabled' : pressed ? 'pressed' : 'resting');

  const iconNode =
    icon == null ? null : typeof icon === 'string' ? (
      <Text style={[styles.iconGlyph, { color: foregroundColor }]}>{icon}</Text>
    ) : (
      icon
    );

  const body = (
    <Pressable
      onPress={isDisabled ? undefined : onPressed ?? undefined}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        {
          height: FLUTTER_FAB.height,
          minWidth: FLUTTER_FAB.height,
          opacity: isDisabled ? 0.6 : 1,
        },
        !absolute ? style : null,
      ]}
    >
      <View
        style={[
          styles.extended,
          elev,
          { backgroundColor: isDisabled ? '#BDBDBD' : backgroundColor },
        ]}
      >
        {iconNode ? <View style={styles.iconSlot}>{iconNode}</View> : null}
        <Text style={[styles.label, { color: foregroundColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );

  if (!absolute) return body;

  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom, right }, style]}>
      {body}
    </View>
  );
}

export type FlutterFabSize = 'regular' | 'small';

export type FlutterFabProps = {
  onPressed: (() => void) | null;
  /** React node (icône) ou symbole texte. */
  icon: React.ReactNode | string;
  backgroundColor?: string;
  foregroundColor?: string;
  disabled?: boolean;
  size?: FlutterFabSize;
  /** Bordure optionnelle (ex. FAB surface). */
  borderColor?: string;
  bottom?: number;
  right?: number;
  absolute?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
};

/**
 * Flutter `FloatingActionButton` (M3) — carré à coins 16 / small 12.
 */
export function FlutterFab({
  onPressed,
  icon,
  backgroundColor = BrandColors.orbit,
  foregroundColor = '#FFFFFF',
  disabled = false,
  size = 'regular',
  borderColor,
  bottom = FLUTTER_FAB.edgeMargin,
  right = FLUTTER_FAB.edgeMargin,
  absolute = false,
  style,
  accessibilityLabel,
}: FlutterFabProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || onPressed == null;
  const elev = elevationStyle(isDisabled ? 'disabled' : pressed ? 'pressed' : 'resting');
  const dim = size === 'small' ? FLUTTER_FAB.small : FLUTTER_FAB.height;
  const radius = size === 'small' ? FLUTTER_FAB.smallRadius : FLUTTER_FAB.radius;

  const iconNode =
    typeof icon === 'string' ? (
      <Text style={[styles.iconGlyph, { color: foregroundColor }]}>{icon}</Text>
    ) : (
      icon
    );

  const body = (
    <Pressable
      onPress={isDisabled ? undefined : onPressed ?? undefined}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        {
          width: dim,
          height: dim,
          opacity: isDisabled ? 0.6 : 1,
        },
        !absolute ? style : null,
      ]}
    >
      <View
        style={[
          {
            width: dim,
            height: dim,
            borderRadius: radius,
            backgroundColor: isDisabled ? '#BDBDBD' : backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: borderColor ? 0.1 : 0,
            borderColor: borderColor ?? 'transparent',
          },
          elev,
        ]}
      >
        {iconNode}
      </View>
    </Pressable>
  );

  if (!absolute) return body;

  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom, right }, style]}>
      {body}
    </View>
  );
}

/** Exemple d’usage (référence) :
 *
 * ```tsx
 * <View style={{ flex: 1 }}>
 *   <FlutterExtendedFab
 *     onPressed={() => {}}
 *     label="Create"
 *     icon="+"
 *     backgroundColor="#6750A4"
 *   />
 *   <FlutterFab
 *     onPressed={() => {}}
 *     icon="+"
 *     accessibilityLabel="Add"
 *     absolute
 *     bottom={88}
 *   />
 * </View>
 * ```
 */

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 100,
    alignItems: 'flex-end',
  },
  extended: {
    height: FLUTTER_FAB.height,
    minWidth: FLUTTER_FAB.height,
    borderRadius: FLUTTER_FAB.radius,
    paddingHorizontal: FLUTTER_FAB.hPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: FLUTTER_FAB.iconGap,
  },
  iconSlot: {
    width: FLUTTER_FAB.iconSize,
    height: FLUTTER_FAB.iconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
