import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  ClipboardText,
  Star,
  ShieldCheck,
  Wrench,
  Images,
  CaretRight,
} from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

export default function ProviderDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const profile = user?.profile;

  const stats = [
    {
      key: 'views',
      label: t('providerDashboard.statViews'),
      value: profile?.viewCount ?? 0,
      icon: Eye,
    },
    {
      key: 'orders',
      label: t('providerDashboard.statOrders'),
      value: profile?.completedOrders ?? 0,
      icon: ClipboardText,
    },
    {
      key: 'rating',
      label: t('providerDashboard.statRating'),
      value: (profile?.averageRating ?? 0).toFixed(1),
      icon: Star,
    },
    {
      key: 'trust',
      label: t('providerDashboard.statTrust'),
      value: profile?.trustScore ?? 0,
      icon: ShieldCheck,
    },
  ];

  const quickLinks = [
    {
      key: 'services',
      title: t('profile.myServices'),
      description: t('profile.myServicesDesc'),
      icon: Wrench,
      href: '/provider/services' as const,
    },
    {
      key: 'portfolio',
      title: t('service.portfolio'),
      description: t('profile.portfolioDesc'),
      icon: Images,
      href: '/portfolio' as const,
    },
  ];

  return (
    <PageScaffold
      title={t('profile.dashboard')}
      subtitle={t('providerDashboard.subtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View
                key={stat.key}
                style={{
                  width: '47%',
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.xl,
                  padding: 18,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.iconWash,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Icon size={18} color={colors.orbit} weight="fill" />
                </View>
                <Text
                  style={[
                    textStyle('featureHeading'),
                    { color: colors.ink, fontSize: 28, lineHeight: 34 },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                  {stat.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text
          style={[
            textStyle('body'),
            {
              color: colors.ink,
              fontWeight: '600',
              marginTop: Spacing.seven,
              marginBottom: Spacing.three,
            },
          ]}
        >
          {t('providerDashboard.quickLinks')}
        </Text>

        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Pressable
              key={link.key}
              onPress={() => router.push(link.href)}
              style={({ pressed }) => ({
                width: '100%',
                opacity: pressed ? 0.92 : 1,
                marginBottom: 10,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.xl,
                  padding: 16,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.iconWash,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={colors.orbit} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      textStyle('body'),
                      { color: colors.ink, fontWeight: '600' },
                    ]}
                  >
                    {link.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    {link.description}
                  </Text>
                </View>
                <CaretRight size={18} color={colors.muted} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </PageScaffold>
  );
}
