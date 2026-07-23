import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

export interface PillTabItem {
  key: string;
  label: string;
}

interface PillTabsProps {
  tabs: PillTabItem[];
  /** Controlled active tab key. */
  activeKey: string;
  onChange: (key: string) => void;
  /** Outer wrapper style (e.g. horizontal padding for page alignment). */
  style?: StyleProp<ViewStyle>;
  /** Extra style applied to the scrollable content row. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Sliding pill background color. Defaults to brand `orbit`. */
  pillColor?: string;
  /** Active tab label color (sits on the pill). Defaults to white. */
  activeTextColor?: string;
  /** Inactive tab label color. Defaults to theme `ink`. */
  inactiveTextColor?: string;
}

const ANIM = { duration: 260, easing: Easing.out(Easing.cubic) } as const;

interface TabLayout {
  x: number;
  width: number;
}

/**
 * Flutter-style animated segmented tabs.
 *
 * A single filled rounded pill slides + resizes behind the active tab using
 * `react-native-reanimated` (measured per-tab layouts drive an interpolated
 * translateX/width). Each label's color animates as the pill passes under it.
 * Horizontally scrollable so overflowing tabs stay reachable.
 */
export function PillTabs({
  tabs,
  activeKey,
  onChange,
  style,
  contentContainerStyle,
  pillColor,
  activeTextColor = '#FFFFFF',
  inactiveTextColor,
}: PillTabsProps) {
  const { colors } = useAppTheme();
  const activePill = pillColor ?? colors.orbit;
  const inactiveColor = inactiveTextColor ?? colors.ink;

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === activeKey),
  );

  const [layouts, setLayouts] = useState<TabLayout[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const containerWidth = useRef(0);

  // Animated driver — floats between tab indices so the pill can be
  // interpolated across the measured layouts.
  const indicator = useSharedValue(activeIndex);

  useEffect(() => {
    indicator.value = withTiming(activeIndex, ANIM);
  }, [activeIndex, indicator]);

  const handleTabLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const existing = prev[index];
      if (existing && existing.x === x && existing.width === width) return prev;
      const next = [...prev];
      next[index] = { x, width };
      return next;
    });
  }, []);

  // Keep the active tab visible when the row overflows.
  useEffect(() => {
    const layout = layouts[activeIndex];
    if (!layout || containerWidth.current === 0) return;
    const target = layout.x - containerWidth.current / 2 + layout.width / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, target), animated: true });
  }, [activeIndex, layouts]);

  // Precompute on the JS thread — `.map()` callbacks are not callable inside
  // Reanimated worklets (Hermes: "Array.prototype.map() requires a callable argument").
  const measuredLayouts = useMemo(() => {
    if (layouts.length !== tabs.length || !layouts.every(Boolean)) return null;
    return {
      xs: layouts.map((l) => l.x),
      ws: layouts.map((l) => l.width),
      input: layouts.map((_, i) => i),
    };
  }, [layouts, tabs.length]);

  const pillStyle = useAnimatedStyle(() => {
    if (!measuredLayouts || tabs.length === 0) return { opacity: 0 };
    const { xs, ws, input } = measuredLayouts;
    if (input.length === 1) {
      return { opacity: 1, width: ws[0], transform: [{ translateX: xs[0] }] };
    }
    return {
      opacity: 1,
      width: interpolate(indicator.value, input, ws),
      transform: [{ translateX: interpolate(indicator.value, input, xs) }],
    };
  }, [measuredLayouts, tabs.length]);

  return (
    <View style={style}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
        }}
        contentContainerStyle={[styles.row, contentContainerStyle]}
        accessibilityRole="tablist"
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.pill, { backgroundColor: activePill }, pillStyle]}
        />
        {tabs.map((tab, index) => (
          <PillTab
            key={tab.key}
            label={tab.label}
            index={index}
            indicator={indicator}
            selected={index === activeIndex}
            activeColor={activeTextColor}
            inactiveColor={inactiveColor}
            onLayout={(e) => handleTabLayout(index, e)}
            onPress={() => onChange(tab.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface PillTabProps {
  label: string;
  index: number;
  indicator: ReturnType<typeof useSharedValue<number>>;
  selected: boolean;
  activeColor: string;
  inactiveColor: string;
  onLayout: (e: LayoutChangeEvent) => void;
  onPress: () => void;
}

function PillTab({
  label,
  index,
  indicator,
  selected,
  activeColor,
  inactiveColor,
  onLayout,
  onPress,
}: PillTabProps) {
  const textAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      indicator.value,
      [index - 1, index, index + 1],
      [inactiveColor, activeColor, inactiveColor],
    ),
  }));

  return (
    <Pressable
      onLayout={onLayout}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View style={styles.tab}>
        <Animated.Text
          numberOfLines={1}
          style={[
            textStyle('caption'),
            { fontFamily: fontFamily('body', 'medium') },
            textAnimatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.one,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: Radius.pill,
  },
  tab: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.twoHalf,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
