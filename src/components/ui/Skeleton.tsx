import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 20 }: SkeletonProps) {
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
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: '100%',
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceCard,
        overflow: 'hidden',
      }}
    >
      <Skeleton width="100%" height={190} borderRadius={0} />
      <View style={{ padding: Spacing.four, gap: 10 }}>
        <Skeleton height={18} width="75%" />
        <Skeleton height={13} width="95%" />
        <Skeleton height={1} width="100%" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton height={30} width={120} borderRadius={Radius.pill} />
          <Skeleton height={18} width={60} />
        </View>
      </View>
    </View>
  );
}
