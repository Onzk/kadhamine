import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

import { LightTheme } from '@/theme/tokens';

/** Paint the native root as soon as the JS bundle loads (avoids a white/black flash). */
void SystemUI.setBackgroundColorAsync(LightTheme.canvas);

/**
 * Keeps the native root background + Android nav button contrast in sync with
 * the active theme canvas.
 *
 * With edge-to-edge (SDK 54), the system nav bar is transparent when
 * `enforceContrast` is false. The color seen under the nav buttons comes from
 * `SystemUI.setBackgroundColorAsync` + React root views painted with canvas.
 */
export function useSystemChrome(canvas: string, isDark: boolean) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(canvas);

    if (Platform.OS !== 'android') return;

    try {
      // Edge-to-edge (SDK 54+): `dark` = dark bar + light buttons; `light` = light bar + dark buttons.
      NavigationBar.setStyle(isDark ? 'dark' : 'light');
    } catch {
      // Legacy: button style only — `light` buttons on dark bg, `dark` buttons on light bg.
      void NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {
        // Expo Go / gesture nav / unsupported devices
      });
    }
  }, [canvas, isDark]);
}
