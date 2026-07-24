import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserFocus } from 'phosphor-react-native';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

interface OwnAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Override body copy (profile vs service). */
  message?: string;
}

/** Explains that Commander / Contacter are unavailable on one's own account. */
export function OwnAccountSheet({ visible, onClose, message }: OwnAccountSheetProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const title = t('common.ownAccountTitle');

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
      maxHeightRatio={0.55}
    >
      <View
        style={{
          alignSelf: 'stretch',
          width: '100%',
          alignItems: 'center',
          paddingTop: Spacing.two,
        }}
      >
        <View style={{ marginBottom: Spacing.five }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: Radius.pill,
              backgroundColor: colors.orbitWash,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserFocus size={28} color={colors.orbit} weight="fill" />
          </View>
        </View>
        <Text
          style={[
            textStyle('productDisplay'),
            {
              color: colors.ink,
              textAlign: 'center',
              marginBottom: Spacing.three,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            textStyle('body'),
            {
              color: colors.muted,
              textAlign: 'center',
              marginBottom: Spacing.three,
              lineHeight: 22,
            },
          ]}
        >
          {t('common.ownAccountSubtitle')}
        </Text>
        <Text
          style={[
            textStyle('body'),
            {
              color: colors.body,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: Spacing.five,
            },
          ]}
        >
          {message ?? t('common.ownAccountBody')}
        </Text>
        <SheetActionsFooter>
          <SheetSingleAction>
            <AuthPrimaryButton title={t('common.done')} onPress={onClose} tone="orbit" flat />
          </SheetSingleAction>
        </SheetActionsFooter>
      </View>
    </AppBottomSheet>
  );
}
