import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
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
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? DarkTheme : LightTheme;

  const toggle = useCallback(() => {
    setMode((prev) => {
      const currentlyDark = prev === 'system' ? systemScheme === 'dark' : prev === 'dark';
      return currentlyDark ? 'light' : 'dark';
    });
  }, [systemScheme]);

  const value = useMemo(
    () => ({ colors, isDark, mode, setMode, toggle }),
    [colors, isDark, mode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className={isDark ? 'dark flex-1' : 'flex-1'} style={{ flex: 1 }}>
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
