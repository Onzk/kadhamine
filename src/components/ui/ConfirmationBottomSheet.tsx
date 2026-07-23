import React from 'react';
import { View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';

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
}

/** Confirmation — annuler ou confirmer une action. */
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
      scrollable={false}
      showClose={false}
      maxHeightRatio={0.5}
    >
      {message ? (
        <Text variant="body" style={{ color: colors.muted, marginBottom: Spacing.five }}>
          {message}
        </Text>
      ) : (
        <View style={{ height: Spacing.two }} />
      )}
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Button
          title={cancelLabel}
          variant="outline"
          onPress={onClose}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          title={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={handleConfirm}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </AppBottomSheet>
  );
}
