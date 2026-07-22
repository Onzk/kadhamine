import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {
  SofiaSans_400Regular,
  SofiaSans_500Medium,
  SofiaSans_700Bold,
} from '@expo-google-fonts/sofia-sans';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    SofiaSans_400Regular,
    SofiaSans_500Medium,
    SofiaSans_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F3F0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
});
