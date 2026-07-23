import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

function LegalSection({ title, body }: { title: string; body: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: Spacing.five }}>
      <Text
        style={[
          textStyle('body'),
          { fontWeight: '700', color: colors.ink, marginBottom: Spacing.two },
        ]}
      >
        {title}
      </Text>
      <Text style={[textStyle('body'), { color: colors.body, lineHeight: 24 }]}>{body}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <PageScaffold
      title={t('profile.privacy')}
      subtitle={t('profile.privacySubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <Text style={[textStyle('caption'), { color: colors.muted, marginBottom: Spacing.five }]}>
          {t('profile.legalUpdated')}
        </Text>
        <LegalSection title={t('profile.privacySection1Title')} body={t('profile.privacySection1Body')} />
        <LegalSection title={t('profile.privacySection2Title')} body={t('profile.privacySection2Body')} />
        <LegalSection title={t('profile.privacySection3Title')} body={t('profile.privacySection3Body')} />
      </View>
    </PageScaffold>
  );
}
