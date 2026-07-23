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

export default function TermsOfServiceScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <PageScaffold
      title={t('profile.terms')}
      subtitle={t('profile.termsSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <Text style={[textStyle('caption'), { color: colors.muted, marginBottom: Spacing.five }]}>
          {t('profile.legalUpdated')}
        </Text>
        <LegalSection title={t('profile.termsSection1Title')} body={t('profile.termsSection1Body')} />
        <LegalSection title={t('profile.termsSection2Title')} body={t('profile.termsSection2Body')} />
        <LegalSection title={t('profile.termsSection3Title')} body={t('profile.termsSection3Body')} />
      </View>
    </PageScaffold>
  );
}
