import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors, Spacing } from '@/theme/tokens';

export default function ProviderDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const profile = user?.profile;

  const stats = [
    { label: 'Vues', value: profile?.viewCount ?? 0 },
    { label: 'Commandes', value: profile?.completedOrders ?? 0 },
    { label: 'Note', value: profile?.averageRating.toFixed(1) ?? '0.0' },
    { label: 'Confiance', value: profile?.trustScore ?? 0 },
  ];

  return (
    <PageScaffold
      title={t('profile.dashboard')}
      subtitle="Vue d'ensemble de votre activité prestataire."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{
                width: '47%',
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 28, fontWeight: '700', color: BrandColors.ink }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </PageScaffold>
  );
}
