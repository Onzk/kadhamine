import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const FAB_HEIGHT = 56;
const FAB_ICON_SIZE = 56;
const EDGE_MARGIN = 16;
const LABEL_MAX_WIDTH = 140;
const ANIM_MS = 220;

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
 * Extended FAB animé (API `Animated` native).
 * Le label à côté de l’icône s’étend / se replie en douceur.
 * Position fixe bas-droite.
 */
export function AnimatedExtendedFab({
  expanded,
  label,
  onPress,
  icon,
  accessibilityLabel,
  backgroundColor = '#F37338',
  foregroundColor = '#F3F0EE',
  bottom = EDGE_MARGIN,
  right = EDGE_MARGIN,
  style,
}: AnimatedExtendedFabProps) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width / padding ne sont pas supportés par le native driver
    }).start();
  }, [expanded, progress]);

  const labelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LABEL_MAX_WIDTH],
  });

  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });

  const labelPaddingEnd = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom, right }, style]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ expanded }}
      >
        <Animated.View
          style={[
            styles.fab,
            {
              backgroundColor,
              paddingRight: labelPaddingEnd,
            },
            styles.shadow,
          ]}
        >
          <View style={styles.iconSlot}>{icon}</View>

          <Animated.View
            style={[
              styles.labelClip,
              {
                width: labelWidth,
                opacity: labelOpacity,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: foregroundColor }]}
            >
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
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
    height: FAB_HEIGHT,
    minWidth: FAB_ICON_SIZE,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconSlot: {
    width: FAB_ICON_SIZE,
    height: FAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelClip: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
