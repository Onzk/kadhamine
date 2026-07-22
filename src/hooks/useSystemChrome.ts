import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

/** Synchronise la couleur du root view + barre de navigation système (Android). */
export function useSystemChrome(canvas: string, isDark: boolean) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(canvas);

    if (Platform.OS !== 'android') return;

    void (async () => {
      try {
        NavigationBar.setStyle(isDark ? 'dark' : 'light');
        await NavigationBar.setPositionAsync('absolute');
        await NavigationBar.setBackgroundColorAsync(canvas);
        await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      } catch {
        // Expo Go / edge-to-edge : ignorer si non supporté
      }
    })();
  }, [canvas, isDark]);
}
