import '@/global.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSafeArea } from '@/components/AppSafeArea';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/providers/AuthProvider';
import { FontProvider } from '@/providers/FontProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { ThemeProvider, useAppTheme } from '@/providers/ThemeProvider';
import { convexAuthStorage } from '@/services/authStorage';
import { NAV_THEME } from '@/lib/theme';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || '';
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
          <ThemeProvider>
            <FontProvider>
              <I18nProvider>
                <RootContent />
              </I18nProvider>
            </FontProvider>
          </ThemeProvider>
        </ConvexAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
