import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { WarningCircle } from 'phosphor-react-native';

import { BootErrorFallback } from '@/components/errors/BootErrorFallback';
import { Text } from '@/components/ui/ThemedText';
import { reportError } from '@/lib/reportError';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type ErrorFallbackProps = {
  error: Error;
  reset: () => void;
};

/** Fallback thématisé ; bascule sur BootErrorFallback si thème/i18n plantent. */
export function ThemedErrorFallback({ error, reset }: ErrorFallbackProps) {
  try {
    return <ThemedErrorFallbackInner error={error} reset={reset} />;
  } catch (fallbackError) {
    reportError(fallbackError, { context: 'ThemedErrorFallback', severity: 'warning' });
    return (
      <BootErrorFallback
        error={error}
        onRetry={reset}
        title="Une erreur est survenue"
        description="Impossible d’afficher cet écran. Réessayez."
      />
    );
  }
}

function ThemedErrorFallbackInner({ error, reset }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();

  const goHome = () => {
    try {
      reset();
      router.replace('/(tabs)');
    } catch (e) {
      reportError(e, { context: 'ErrorFallback.goHome', severity: 'warning' });
      reset();
    }
  };

  return (
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
        <WarningCircle size={36} color={colors.orbit} weight="fill" />
      </View>
      <Text
        style={[
          textStyle('featureHeading'),
          { color: colors.ink, textAlign: 'center', marginBottom: Spacing.two },
        ]}
      >
        {t('common.crashTitle', { defaultValue: t('common.error') })}
      </Text>
      <Text
        style={[
          textStyle('body'),
          { color: colors.muted, textAlign: 'center', marginBottom: Spacing.six },
        ]}
      >
        {t('common.crashDesc', { defaultValue: t('common.errorDesc') })}
      </Text>

      {__DEV__ && error.message ? (
        <Text
          style={[
            textStyle('micro'),
            {
              color: colors.error,
              textAlign: 'center',
              marginBottom: Spacing.five,
              paddingHorizontal: Spacing.two,
            },
          ]}
          numberOfLines={4}
        >
          {error.message}
        </Text>
      ) : null}

      <View style={{ width: '100%', maxWidth: 320, gap: Spacing.three }}>
        <Pressable
          onPress={reset}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
          style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
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
              {t('common.retry')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel={t('common.goHome', { defaultValue: t('tabs.home') })}
          style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
        >
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.button,
              borderWidth: 1,
              borderColor: colors.borderStrong,
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
                color: colors.ink,
              }}
            >
              {t('common.goHome', { defaultValue: t('tabs.home') })}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
