import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

/**
 * Synchronise la couleur du root view + le contraste des boutons de la barre
 * de navigation système (Android).
 *
 * En edge-to-edge (défaut SDK 54), la barre de navigation est transparente :
 * le fond racine (`SystemUI`) transparaît derrière, donc `setPositionAsync` et
 * `setBackgroundColorAsync` (non supportés en edge-to-edge) sont inutiles.
 * On garde uniquement le style des boutons pour le contraste.
 */
export function useSystemChrome(canvas: string, isDark: boolean) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(canvas);

    if (Platform.OS !== 'android') return;

    void (async () => {
      try {
        await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      } catch {
        // Ignorer si non supporté (Expo Go, navigation gestuelle, etc.)
      }
    })();
  }, [canvas, isDark]);
}
