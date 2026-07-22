import '@/global.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { ConvexReactClient } from 'convex/react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSafeArea } from '@/components/AppSafeArea';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NAV_THEME } from '@/lib/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { FontProvider } from '@/providers/FontProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { ThemeProvider, useAppTheme } from '@/providers/ThemeProvider';
import { convexAuthStorage } from '@/services/authStorage';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || '';
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

function ThemedGestureRoot({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      {children}
    </GestureHandlerRootView>
  );
}

function RootContent() {
  const { isDark } = useAppTheme();
  const navTheme = isDark ? NAV_THEME.dark : NAV_THEME.light;

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <AuthProvider>
        <AppSafeArea>
          <Slot />
        </AppSafeArea>
      </AuthProvider>
      <PortalHost />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
        <ThemeProvider>
          <ThemedGestureRoot>
            <FontProvider>
              <I18nProvider>
                <RootContent />
              </I18nProvider>
            </FontProvider>
          </ThemedGestureRoot>
        </ThemeProvider>
      </ConvexAuthProvider>
    </SafeAreaProvider>
  );
}
