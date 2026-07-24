import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import { Logo } from '@/components/brand/Logo';
import { PremiumRingFrame } from '@/components/ui/PremiumRingFrame';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';

const DURATION = 1200;
const LOGO_SIZE = 120;

export function AnimatedSplashOverlay() {
  const { colors } = useAppTheme();
  const { user, isLoading } = useAuth();
  const [visible, setVisible] = useState(true);

  const isPremium = !!user?.profile?.isPremium;

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(350).easing(Easing.out(Easing.cubic))}
      style={[styles.overlay, { backgroundColor: colors.canvas }]}
    >
      <Animated.View entering={FadeIn.duration(450).easing(Easing.out(Easing.cubic))} style={styles.logoWrap}>
        <PremiumRingFrame size={LOGO_SIZE} isPremium={isPremium}>
          <Logo size={LOGO_SIZE} />
        </PremiumRingFrame>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
