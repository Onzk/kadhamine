import React from 'react';
import { View, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPinArea } from 'phosphor-react-native';

import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

/** Route introuvable — évite un écran vide / crash navigateur. */
export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: Spacing.eight,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.orbitWash,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.five,
          }}
        >
          <MapPinArea size={36} color={colors.orbit} weight="duotone" />
        </View>
        <Text
          style={[
            textStyle('featureHeading'),
            { color: colors.ink, textAlign: 'center', marginBottom: Spacing.two },
          ]}
        >
          {t('common.notFoundTitle')}
        </Text>
        <Text
          style={[
            textStyle('body'),
            { color: colors.muted, textAlign: 'center', marginBottom: Spacing.six },
          ]}
        >
          {t('common.notFoundDesc')}
        </Text>
        <Link href="/(tabs)" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.goHome')}
            style={({ pressed }) => [{ minWidth: 160 }, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                backgroundColor: colors.ink,
                borderRadius: Radius.button,
                paddingHorizontal: Spacing.six,
                paddingVertical: Spacing.three,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 16,
                  color: colors.onPrimary,
                }}
              >
                {t('common.goHome')}
              </Text>
            </View>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
