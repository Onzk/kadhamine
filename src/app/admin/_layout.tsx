import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (user?.role !== 'admin') {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="user/[userId]/services" />
      <Stack.Screen name="user/[userId]/portfolio" />
    </Stack>
  );
}
