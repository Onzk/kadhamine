import { Stack } from 'expo-router';

export { ExpoRouteErrorBoundary as ErrorBoundary } from '@/components/errors/ExpoRouteErrorBoundary';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
