import React from 'react';
import { View } from 'react-native';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

export interface AlertBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Ligne secondaire sous le titre. */
  subtitle?: string;
  message?: string;
  detail?: string;
  buttonLabel?: string;
  onDismiss?: () => void;
  /** Icône principale centrée au-dessus du titre. */
  icon?: React.ReactNode;
  /** Wash behind the icon — `error` keeps error UI red-only (no orbit blue). */
  iconTone?: 'default' | 'error' | 'success';
}

/**
 * Alerte post-action — contenu centré :
 * icône → titre → description → bouton (X en haut à droite).
 */
export function AlertBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  message,
  detail,
  buttonLabel = 'OK',
  onDismiss,
  icon,
  iconTone = 'default',
}: AlertBottomSheetProps) {
  const { colors } = useAppTheme();

  const iconWash =
    iconTone === 'error'
      ? colors.error + '12'
      : iconTone === 'success'
        ? colors.success + '12'
        : colors.orbitWash;

  const handlePress = () => {
    onDismiss?.();
    onClose();
  };

  const hasBodyCopy = Boolean(subtitle || message || detail);

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      hideHeader
      scrollable={false}
      stickyHeader={false}
      showHandle={false}
      showClose
      maxHeightRatio={0.62}
    >
      <View
        style={{
          alignSelf: 'stretch',
          width: '100%',
          minHeight: 160,
          alignItems: 'center',
          // Laisse de la place au X flottant quand il n’y a pas d’icône.
          paddingTop: icon ? Spacing.two : Spacing.eight,
        }}
      >
        {icon ? (
          <View style={{ marginBottom: Spacing.five }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: Radius.pill,
                backgroundColor: iconWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </View>
          </View>
        ) : null}

        <Text
          style={[
            textStyle('productDisplay'),
            {
              color: colors.ink,
              textAlign: 'center',
              marginBottom: hasBodyCopy ? Spacing.three : Spacing.five,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            variant="body"
            style={{
              color: colors.muted,
              textAlign: 'center',
              marginBottom: message || detail ? Spacing.two : Spacing.five,
              lineHeight: 22,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {message ? (
          <Text
            variant="body"
            style={{
              color: colors.body,
              textAlign: 'center',
              marginBottom: detail ? Spacing.three : Spacing.five,
              lineHeight: 22,
            }}
          >
            {message}
          </Text>
        ) : null}

        {detail ? (
          <Text
            variant="body"
            style={{
              color: colors.muted,
              textAlign: 'center',
              marginBottom: Spacing.five,
              lineHeight: 22,
            }}
          >
            {detail}
          </Text>
        ) : null}

        {!hasBodyCopy ? <View style={{ height: Spacing.two }} /> : null}

        <SheetActionsFooter>
          <SheetSingleAction>
            <AuthPrimaryButton title={buttonLabel} onPress={handlePress} tone="ink" flat />
          </SheetSingleAction>
        </SheetActionsFooter>
      </View>
    </AppBottomSheet>
  );
}
