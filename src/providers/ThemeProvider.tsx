import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { Appearance, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { LightTheme, DarkTheme, type ThemeColors } from '@/theme/tokens';
import { useSystemChrome } from '@/hooks/useSystemChrome';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'talenttchad_theme';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function applyAppearance(mode: ThemeMode) {
  if (mode === 'system') {
    Appearance.setColorScheme(null);
  } else {
    Appearance.setColorScheme(mode);
  }
}

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (cancelled) return;
      if (isThemeMode(stored)) {
        setModeState(stored);
        applyAppearance(stored);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? DarkTheme : LightTheme;

  useSystemChrome(colors.canvas, isDark);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyAppearance(next);
    AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const currentlyDark = prev === 'system' ? systemScheme === 'dark' : prev === 'dark';
      const next: ThemeMode = currentlyDark ? 'light' : 'dark';
      applyAppearance(next);
      AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, [systemScheme]);

  // Keep RN Appearance in sync when following system
  useEffect(() => {
    if (!hydrated) return;
    if (mode === 'system') {
      Appearance.setColorScheme(null);
    }
  }, [mode, hydrated]);

  // Drive NativeWind's `dark:` variants (tailwind darkMode: 'class') via its
  // global color-scheme observable. We intentionally do NOT toggle a `dark`
  // className on an app-root <View>: mutating a variable-producing className on
  // a subtree after the first render makes css-interop fire a dev-only
  // `printUpgradeWarning`, whose prop serializer walks the whole child tree and
  // reads React Navigation's context default, throwing "Couldn't find a
  // navigation context" at startup.
  useEffect(() => {
    nativewindColorScheme.set(mode);
  }, [mode]);

  const value = useMemo(
    () => ({ colors, isDark, mode, setMode, toggle }),
    [colors, isDark, mode, setMode, toggle],
  );

  // Avoid a wrong-theme flash until the saved preference is restored.
  if (!hydrated) {
    const placeholderBg =
      (systemScheme === 'dark' ? DarkTheme : LightTheme).canvas;
    return <View style={{ flex: 1, backgroundColor: placeholderBg }} />;
  }

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
