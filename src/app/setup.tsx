import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Cloud } from 'phosphor-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAppTheme } from '@/providers/ThemeProvider';

export default function SetupScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('setup.title')} />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Cloud size={40} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink, marginBottom: 12 }}>
            {t('setup.convex')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.body, marginBottom: 16, lineHeight: 22 }}>
            1. {t('setup.step1')}
          </Text>
          <View
            style={{
              backgroundColor: colors.canvasSoft,
              borderRadius: 6,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontFamily: 'monospace', color: colors.primary, fontSize: 13 }}>
              npx convex dev
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.body, lineHeight: 22 }}>
            2. {t('setup.step2')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
