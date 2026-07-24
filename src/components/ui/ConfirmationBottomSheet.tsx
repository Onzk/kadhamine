import React from 'react';
import { View } from 'react-native';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

export interface ConfirmationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Icône optionnelle centrée au-dessus du titre. */
  icon?: React.ReactNode;
}

/** Confirmation — annuler ou confirmer une action (contenu centré). */
export function ConfirmationBottomSheet({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  loading = false,
  onConfirm,
  icon,
}: ConfirmationBottomSheetProps) {
  const { colors } = useAppTheme();

  const handleConfirm = async () => {
    await onConfirm();
  };

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
      maxHeightRatio={0.5}
      bottomPadExtra={Spacing.four}
    >
      <View
        style={{
          alignSelf: 'stretch',
          width: '100%',
          minHeight: 140,
          alignItems: 'center',
          // Place pour le X flottant.
          paddingTop: icon ? Spacing.five : Spacing.eight,
        }}
      >
        {icon ? (
          <View style={{ marginBottom: Spacing.four, alignItems: 'center' }}>{icon}</View>
        ) : null}

        <Text
          style={[
            textStyle('productDisplay'),
            {
              color: colors.ink,
              textAlign: 'center',
              marginBottom: message ? Spacing.three : Spacing.four,
            },
          ]}
        >
          {title}
        </Text>

        {message ? (
          <Text
            variant="body"
            style={{
              color: colors.muted,
              textAlign: 'center',
              marginBottom: Spacing.four,
              lineHeight: 22,
            }}
          >
            {message}
          </Text>
        ) : (
          <View style={{ height: Spacing.two }} />
        )}

        <SheetActionsFooter>
          <SheetActionRow>
            <SheetActionSlot>
              <AuthPrimaryButton
                title={cancelLabel}
                onPress={onClose}
                disabled={loading}
                tone="outline"
                flat
                fill
              />
            </SheetActionSlot>
            <SheetActionSlot>
              <AuthPrimaryButton
                title={confirmLabel}
                onPress={handleConfirm}
                loading={loading}
                tone={destructive ? 'danger' : 'ink'}
                flat
                fill
              />
            </SheetActionSlot>
          </SheetActionRow>
        </SheetActionsFooter>
      </View>
    </AppBottomSheet>
  );
}
