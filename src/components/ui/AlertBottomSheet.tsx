import React from 'react';
import { View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';

export interface AlertBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttonLabel?: string;
  onDismiss?: () => void;
}

/** Message simple — un bouton de fermeture. */
export function AlertBottomSheet({
  visible,
  onClose,
  title,
  message,
  buttonLabel = 'OK',
  onDismiss,
}: AlertBottomSheetProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    onDismiss?.();
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handlePress}
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
      <Button title={buttonLabel} onPress={handlePress} fullWidth />
    </AppBottomSheet>
  );
}
