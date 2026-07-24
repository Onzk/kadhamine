import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { hasSeenOnboarding } from '@/services/onboardingStorage';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { colors } = useAppTheme();
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(true);

  useEffect(() => {
    let alive = true;
    hasSeenOnboarding().then((seen) => {
      if (!alive) return;
      setSeenOnboarding(seen);
      setOnboardingReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
    return <Redirect href="/setup" />;
  }

  if (isLoading || !onboardingReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!seenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (isAuthenticated && !user?.profile) {
    return <Redirect href="/(auth)/complete-profile" />;
  }

  if (isAuthenticated && user?.profile) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(tabs)" />;
}
