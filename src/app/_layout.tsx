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
// Side-effect: paints native root with default canvas before theme hydrates.
import '@/hooks/useSystemChrome';
import { NAV_THEME } from '@/lib/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppDialogProvider } from '@/providers/AppDialogProvider';
import { FontProvider } from '@/providers/FontProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { ThemeProvider, useAppTheme } from '@/providers/ThemeProvider';
import { convexAuthStorage } from '@/services/authStorage';
import { BrandColors } from '@/theme/tokens';

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
        <AppDialogProvider>
          {/* No bottom edge: canvas must paint under the system nav; tabs pad themselves. */}
          <AppSafeArea edges={['top', 'left', 'right']}>
            <Slot />
          </AppSafeArea>
        </AppDialogProvider>
      </AuthProvider>
      <PortalHost />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: BrandColors.canvas }}>
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
