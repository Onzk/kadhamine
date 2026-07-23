import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WarningCircle } from 'phosphor-react-native';

import { Text } from '@/components/ui/ThemedText';
import { reportConvexError } from '@/lib/convexErrors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

type FallbackProps = {
  error: Error;
  reset: () => void;
};

function DefaultErrorFallback({ reset }: FallbackProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

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
        {t('common.error')}
      </Text>
      <Text
        style={[
          textStyle('body'),
          { color: colors.muted, textAlign: 'center', marginBottom: Spacing.six },
        ]}
      >
        {t('common.errorDesc')}
      </Text>
      <Pressable
        onPress={reset}
        accessibilityRole="button"
        accessibilityLabel={t('common.retry')}
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
            {t('common.retry')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

type Props = {
  children: React.ReactNode;
  fallback?: (props: FallbackProps) => React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

/** Capture les erreurs de rendu (ex. useQuery Convex) pour éviter un crash blanc. */
export class ConvexErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportConvexError(error, 'ErrorBoundary');
    if (__DEV__) {
      console.error('[ConvexErrorBoundary] componentStack', info.componentStack);
    }
    this.props.onError?.(error, info);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      const props: FallbackProps = { error, reset: this.reset };
      if (this.props.fallback) return this.props.fallback(props);
      return <DefaultErrorFallback {...props} />;
    }
    return this.props.children;
  }
}
