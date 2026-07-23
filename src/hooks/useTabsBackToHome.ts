import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useRouter, useSegments } from 'expo-router';

/**
 * Android hardware back on tab screens:
 * 1. Nested route under the current tab (stack history) → let default pop.
 * 2. Non-home tab → switch to the home tab.
 * 3. Home tab → allow default (exit app).
 *
 * Scoped with useFocusEffect so screens outside tabs (e.g. map) keep their own back logic.
 */
export function useTabsBackToHome() {
  const router = useRouter();
  const segments = useSegments();

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        // e.g. ['(tabs)'] | ['(tabs)', 'search'] | ['(tabs)', 'profile', 'edit']
        const tabSegment = segments[1];
        const isHome = tabSegment == null || tabSegment === 'index';

        // Deeper than the tab root and stack can pop → don't intercept.
        if (segments.length > 2 && router.canGoBack()) {
          return false;
        }

        if (!isHome) {
          router.navigate('/(tabs)');
          return true;
        }

        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [router, segments]),
  );
}
