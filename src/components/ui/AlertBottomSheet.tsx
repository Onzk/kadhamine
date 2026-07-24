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
  /** Force exactement N lignes sur le message principal. */
  messageNumberOfLines?: number;
  buttonLabel?: string;
  onDismiss?: () => void;
  /** Icône principale centrée au-dessus du titre. */
  icon?: React.ReactNode;
  /** Wash behind the icon — `error` keeps error UI red-only (no orbit blue). */
  iconTone?: 'default' | 'error' | 'success';
}

/**
 * Alerte post-action — hauteur au contenu :
 * X en haut, puis ≥ Spacing.fourteen au-dessus de l’icône, contenu, bouton,
 * puis Spacing.twelve sous le bouton (+ safe area via AppBottomSheet).
 */
export function AlertBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  message,
  detail,
  messageNumberOfLines,
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
      bottomPadExtra={Spacing.twelve}
    >
      <View
        style={{
          alignSelf: 'stretch',
          width: '100%',
          alignItems: 'center',
          // Au moins Spacing.fourteen au-dessus de l’icône (ou du titre).
          paddingTop: Spacing.fourteen,
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
              alignSelf: 'stretch',
              width: '100%',
              color: colors.ink,
              textAlign: 'center',
              marginBottom: hasBodyCopy ? Spacing.three : 0,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            variant="body"
            style={{
              alignSelf: 'stretch',
              width: '100%',
              color: colors.muted,
              textAlign: 'center',
              marginBottom: message || detail ? Spacing.two : 0,
              lineHeight: 22,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {message ? (
          <Text
            variant="body"
            numberOfLines={messageNumberOfLines}
            style={{
              alignSelf: 'stretch',
              width: '100%',
              color: colors.body,
              textAlign: 'center',
              marginBottom: detail ? Spacing.three : 0,
              paddingBottom: detail ? 0 : Spacing.three,
              lineHeight: 22,
              ...(messageNumberOfLines
                ? { minHeight: 22 * messageNumberOfLines }
                : null),
            }}
          >
            {message}
          </Text>
        ) : null}

        {detail ? (
          <Text
            variant="body"
            style={{
              alignSelf: 'stretch',
              width: '100%',
              color: colors.muted,
              textAlign: 'center',
              marginBottom: 0,
              lineHeight: 22,
            }}
          >
            {detail}
          </Text>
        ) : null}

        <SheetActionsFooter>
          <SheetSingleAction>
            <AuthPrimaryButton title={buttonLabel} onPress={handlePress} tone="ink" flat />
          </SheetSingleAction>
        </SheetActionsFooter>
      </View>
    </AppBottomSheet>
  );
}
