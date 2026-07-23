import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <PageScaffold
      title={t('profile.about')}
      subtitle={t('profile.aboutSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View style={{ alignItems: 'center', marginBottom: Spacing.six }}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 88, height: 88, borderRadius: 20 }}
            contentFit="contain"
          />
          <Text
            style={[
              textStyle('featureHeading'),
              { color: colors.ink, marginTop: Spacing.four },
            ]}
          >
            TalentTchad
          </Text>
          <Text style={[textStyle('caption'), { color: colors.muted, marginTop: Spacing.one }]}>
            {t('profile.version', { version: APP_VERSION })}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[textStyle('body'), { color: colors.body, lineHeight: 24 }]}>
            {t('profile.aboutDescription')}
          </Text>

          <View
            style={{
              marginTop: Spacing.six,
              padding: Spacing.four,
              backgroundColor: colors.surfaceCard,
              borderRadius: 16,
              borderWidth: 0.1,
              borderColor: colors.border,
            }}
          >
            <Text style={[textStyle('caption'), { color: colors.muted, lineHeight: 22 }]}>
              {t('app.tagline')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </PageScaffold>
  );
}
