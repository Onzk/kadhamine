import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { Appearance, View, useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, type ThemeColors } from '@/theme/tokens';

type ThemeMode = 'light' | 'dark' | 'system';

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

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? DarkTheme : LightTheme;

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (next === 'system') {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(next);
    }
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const currentlyDark = prev === 'system' ? systemScheme === 'dark' : prev === 'dark';
      const next: ThemeMode = currentlyDark ? 'light' : 'dark';
      Appearance.setColorScheme(next);
      return next;
    });
  }, [systemScheme]);

  // Keep RN Appearance in sync when following system
  useEffect(() => {
    if (mode === 'system') {
      Appearance.setColorScheme(null);
    }
  }, [mode]);

  const value = useMemo(
    () => ({ colors, isDark, mode, setMode, toggle }),
    [colors, isDark, mode, setMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View
        className={isDark ? 'dark flex-1' : 'flex-1'}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
