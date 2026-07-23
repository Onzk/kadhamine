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
      onClose={onClose}
      title={title}
      scrollable={false}
      showHandle={false}
      showClose={false}
      maxHeightRatio={0.5}
    >
      <View style={{ alignSelf: 'stretch', width: '100%', paddingBottom: Spacing.four }}>
        {message ? (
          <Text variant="body" style={{ color: colors.muted, marginBottom: Spacing.five }}>
            {message}
          </Text>
        ) : (
          <View style={{ height: Spacing.two }} />
        )}
        <SheetActionsFooter>
          <SheetSingleAction>
            <AuthPrimaryButton
              title={buttonLabel}
              onPress={handlePress}
              tone="ink"
              flat
            />
          </SheetSingleAction>
        </SheetActionsFooter>
      </View>
    </AppBottomSheet>
  );
}
