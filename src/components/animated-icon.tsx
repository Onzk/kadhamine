import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import { Logo } from '@/components/brand/Logo';
import { useAppTheme } from '@/providers/ThemeProvider';

const DURATION = 1200;

export function AnimatedSplashOverlay() {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(350).easing(Easing.out(Easing.cubic))}
      style={[styles.overlay, { backgroundColor: colors.canvas }]}
    >
      <Animated.View entering={FadeIn.duration(450).easing(Easing.out(Easing.cubic))} style={styles.logoWrap}>
        <Logo size={120} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
