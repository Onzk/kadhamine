import React from 'react';
import { View } from 'react-native';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';

export interface AlertBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Petite description sous le titre (en-tête du sheet). */
  subtitle?: string;
  message?: string;
  detail?: string;
  buttonLabel?: string;
  onDismiss?: () => void;
  /** Icône principale centrée au-dessus du message. */
  icon?: React.ReactNode;
}

/** Message simple — icône optionnelle + un bouton d’action. */
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
}: AlertBottomSheetProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    onDismiss?.();
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      scrollable={false}
      showHandle={false}
      showClose
      maxHeightRatio={0.62}
    >
      <View style={{ alignSelf: 'stretch', width: '100%' }}>
        {icon ? (
          <View style={{ alignItems: 'center', marginBottom: Spacing.five }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.orbitWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </View>
          </View>
        ) : null}

        {message ? (
          <Text
            variant="body"
            style={{
              color: colors.ink,
              marginBottom: detail || icon ? Spacing.three : Spacing.five,
              textAlign: icon ? 'center' : 'left',
            }}
          >
            {message}
          </Text>
        ) : (
          <View style={{ height: Spacing.two }} />
        )}

        {detail ? (
          <Text
            variant="body"
            style={{
              color: colors.muted,
              marginBottom: Spacing.five,
              textAlign: icon ? 'center' : 'left',
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
