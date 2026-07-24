import '@/global.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { ConvexReactClient } from 'convex/react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSafeArea } from '@/components/AppSafeArea';
import { ConvexErrorBoundary } from '@/components/ConvexErrorBoundary';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
// Side-effect: paints native root with default canvas before theme hydrates.
import '@/hooks/useSystemChrome';
import { installErrorGuards } from '@/lib/installErrorGuards';
import { NAV_THEME } from '@/lib/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppDialogProvider } from '@/providers/AppDialogProvider';
import { FontProvider } from '@/providers/FontProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { ThemeProvider, useAppTheme } from '@/providers/ThemeProvider';
import { convexAuthStorage } from '@/services/authStorage';
import { BrandColors } from '@/theme/tokens';

installErrorGuards();

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
  const { isDark, colors } = useAppTheme();
  const navTheme = isDark ? NAV_THEME.dark : NAV_THEME.light;
  const pathname = usePathname();
  /** Map & service detail are edge-to-edge at the top (hero under status bar). */
  const isEdgeToEdgeTop =
    pathname === '/map' ||
    pathname.startsWith('/map/') ||
    pathname.startsWith('/service/');
  const safeEdges = isEdgeToEdgeTop
    ? (['left', 'right'] as const)
    : (['top', 'left', 'right'] as const);

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <AuthProvider>
        <AppDialogProvider>
          {/* No bottom edge: canvas must paint under the system nav; tabs pad themselves. */}
          <AppSafeArea edges={[...safeEdges]}>
            {/*
              Stack (not Slot) so map → service/[id] is a real push: previous screen
              stays mounted in the React tree. freezeOnBlur:false avoids freezing the
              Leaflet WebView while service detail is on top. Session store covers remounts.
            */}
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.canvas },
                freezeOnBlur: false,
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="map" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="talents" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="service/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="provider/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/create" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="checkout/[orderId]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="review/[orderId]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="review/client/[orderId]" options={{ animation: 'slide_from_right' }} />
            </Stack>
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
                <ConvexErrorBoundary>
                  <RootContent />
                </ConvexErrorBoundary>
              </I18nProvider>
            </FontProvider>
          </ThemedGestureRoot>
        </ThemeProvider>
      </ConvexAuthProvider>
    </SafeAreaProvider>
  );
}
