import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BrandColors, Shadows } from '@/theme/tokens';
import { FLUTTER_FAB } from '@/components/ui/FlutterFab';

const ANIM_MS = 200;
/** Padding H étendu — plus serré que Flutter 20 pour labels courts. */
const EXTENDED_PAD_H = 12;
const EXTENDED_GAP = 6;

export type AnimatedExtendedFabProps = {
  /** Contrôle l’état étendu / réduit. */
  expanded: boolean;
  label: string;
  onPress: () => void;
  /** Icône (taille recommandée ~24). */
  icon: React.ReactNode;
  accessibilityLabel?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  bottom?: number;
  right?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Extended FAB animé — même forme / position que `FlutterFab` (M3 r16, 56dp),
 * avec label compact qui se replie au scroll.
 */
export function AnimatedExtendedFab({
  expanded,
  label,
  onPress,
  icon,
  accessibilityLabel,
  backgroundColor = BrandColors.orbit,
  foregroundColor = '#FFFFFF',
  bottom = FLUTTER_FAB.edgeMargin,
  right = FLUTTER_FAB.edgeMargin,
  style,
}: AnimatedExtendedFabProps) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [pressed, setPressed] = useState(false);
  const [labelWidthPx, setLabelWidthPx] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, progress]);

  const labelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(labelWidthPx, 1)],
  });

  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  /** Carré 56 collapsed → icône 24 + paddings extended. */
  const iconSlotWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [FLUTTER_FAB.height, FLUTTER_FAB.iconSize],
  });

  const paddingH = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, EXTENDED_PAD_H],
  });

  const gap = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, EXTENDED_GAP],
  });

  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom, right }, style]}>
      {/* Mesure hors flux pour caler la largeur au texte réel */}
      <Text
        style={[styles.label, styles.measure, { color: foregroundColor }]}
        onLayout={(e) => {
          const w = Math.ceil(e.nativeEvent.layout.width);
          if (w > 0 && w !== labelWidthPx) setLabelWidthPx(w);
        }}
      >
        {label}
      </Text>

      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ expanded }}
        style={({ pressed: p }) => [{ opacity: p ? 0.92 : 1 }]}
      >
        <Animated.View
          style={[
            styles.fab,
            pressed ? Shadows.fabPressed : Shadows.fab,
            {
              backgroundColor,
              paddingLeft: paddingH,
              paddingRight: paddingH,
              gap,
            },
          ]}
        >
          <Animated.View style={[styles.iconSlot, { width: iconSlotWidth }]}>
            {icon}
          </Animated.View>

          <Animated.View
            style={[
              styles.labelClip,
              {
                width: labelWidth,
                opacity: labelOpacity,
              },
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, { color: foregroundColor }]}>
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/**
 * Hook utilitaire : étendu en haut de liste / scroll vers le haut,
 * replié dès qu’on scrolle vers le bas.
 */
export function useScrollExpandedFab(threshold = 8) {
  const [expanded, setExpanded] = React.useState(true);
  const expandedRef = useRef(true);
  const lastOffset = useRef(0);

  const onScrollY = (y: number) => {
    const delta = y - lastOffset.current;
    lastOffset.current = y;

    if (y <= threshold) {
      if (!expandedRef.current) {
        expandedRef.current = true;
        setExpanded(true);
      }
      return;
    }

    if (delta > threshold && expandedRef.current) {
      expandedRef.current = false;
      setExpanded(false);
    } else if (delta < -threshold && !expandedRef.current) {
      expandedRef.current = true;
      setExpanded(true);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScrollY(e.nativeEvent.contentOffset.y);
  };

  return { expanded, setExpanded, onScroll, onScrollY };
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 100,
    alignItems: 'flex-end',
  },
  fab: {
    height: FLUTTER_FAB.height,
    minWidth: FLUTTER_FAB.height,
    borderRadius: FLUTTER_FAB.radius,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconSlot: {
    height: FLUTTER_FAB.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelClip: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
  },
});
