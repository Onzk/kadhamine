import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/providers/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8 }: SkeletonProps) {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.surfaceStrong,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ServiceCardSkeleton() {
  return (
    <View style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
      <Skeleton height={140} borderRadius={0} />
      <View style={{ padding: 14, gap: 8 }}>
        <Skeleton height={18} width="70%" />
        <Skeleton height={14} />
        <Skeleton height={14} width="90%" />
        <Skeleton height={16} width="40%" />
      </View>
    </View>
  );
}
