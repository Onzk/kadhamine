import React from 'react';
import { View, Pressable, Text as RNText, ScrollView } from 'react-native';

import { BrandColors, Radius, Spacing } from '@/theme/tokens';

type Props = {
  error?: Error | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  /** Titres hardcodés (pas d’i18n / thème) — dernier recours boot. */
  title?: string;
  description?: string;
  retryLabel?: string;
  homeLabel?: string;
  showDetails?: boolean;
};

/**
 * Fallback anti-crash sans hooks (thème / i18n / Convex).
 * Utilisable même si les providers ont planté.
 */
export function BootErrorFallback({
  error,
  onRetry,
  onGoHome,
  title = 'Une erreur est survenue',
  description = 'Impossible d’afficher cet écran. Réessayez ou revenez à l’accueil.',
  retryLabel = 'Réessayer',
  homeLabel = 'Retour à l’accueil',
  showDetails = __DEV__,
}: Props) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BrandColors.canvas,
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
          backgroundColor: '#E8E2DA',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.five,
        }}
      >
        <RNText style={{ fontSize: 32, color: BrandColors.orbit }}>!</RNText>
      </View>

      <RNText
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: BrandColors.ink,
          textAlign: 'center',
          marginBottom: Spacing.two,
        }}
      >
        {title}
      </RNText>
      <RNText
        style={{
          fontSize: 15,
          lineHeight: 22,
          color: '#5C574F',
          textAlign: 'center',
          marginBottom: Spacing.six,
        }}
      >
        {description}
      </RNText>

      {showDetails && error?.message ? (
        <ScrollView
          style={{
            maxHeight: 120,
            width: '100%',
            marginBottom: Spacing.five,
            backgroundColor: BrandColors.lifted,
            borderRadius: Radius.sm,
          }}
          contentContainerStyle={{ padding: Spacing.three }}
        >
          <RNText style={{ fontSize: 11, color: BrandColors.crimson, fontFamily: 'monospace' }}>
            {error.name ? `${error.name}: ` : ''}
            {error.message}
          </RNText>
        </ScrollView>
      ) : null}

      <View style={{ width: '100%', maxWidth: 320, gap: Spacing.three }}>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                backgroundColor: BrandColors.ink,
                borderRadius: Radius.button,
                paddingHorizontal: Spacing.six,
                paddingVertical: Spacing.three,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
              }}
            >
              <RNText style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                {retryLabel}
              </RNText>
            </View>
          </Pressable>
        ) : null}

        {onGoHome ? (
          <Pressable
            onPress={onGoHome}
            accessibilityRole="button"
            accessibilityLabel={homeLabel}
            style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                backgroundColor: BrandColors.lifted,
                borderRadius: Radius.button,
                borderWidth: 1,
                borderColor: BrandColors.dust,
                paddingHorizontal: Spacing.six,
                paddingVertical: Spacing.three,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
              }}
            >
              <RNText style={{ fontSize: 16, fontWeight: '600', color: BrandColors.ink }}>
                {homeLabel}
              </RNText>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
