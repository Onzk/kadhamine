import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import {
  UsersThree,
  Warning,
  CreditCard,
  Shield,
  Star,
  CaretRight,
  Gear,
} from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const stats = useQuery(api.admin.dashboard);

  const menu = [
    { icon: UsersThree, label: t('admin.menuUsers'), route: '/admin/users', badge: stats?.pendingProviders },
    { icon: Shield, label: t('admin.menuVerifications'), route: '/admin/verifications', badge: stats?.pendingVerifications },
    { icon: Warning, label: t('admin.menuReports'), route: '/admin/reports', badge: stats?.openReports },
    { icon: Star, label: t('admin.menuReviews'), route: '/admin/reviews' },
    { icon: CreditCard, label: t('admin.menuPayments'), route: '/admin/payments' },
    { icon: Gear, label: t('admin.menuSettings'), route: '/admin/settings' },
  ];

  return (
    <PageScaffold
      title={t('admin.dashboardTitle')}
      subtitle={t('admin.dashboardSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            backgroundColor: BrandColors.ink,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#FFFFFF99', fontSize: 13 }}>{t('admin.revenue')}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 4 }}>
            {formatPrice(stats?.totalRevenue ?? 0)}
          </Text>
          <Text style={{ color: BrandColors.gold, fontSize: 13, marginTop: 8 }}>
            {t('admin.volume')}: {formatPrice(stats?.totalVolume ?? 0)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {[
            { label: t('admin.statUsers'), value: stats?.totalUsers ?? 0 },
            { label: t('admin.statProviders'), value: stats?.totalProviders ?? 0 },
            { label: t('admin.statOrders'), value: stats?.totalOrders ?? 0 },
            { label: t('admin.statPremium'), value: stats?.activePremium ?? 0 },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                width: '47%',
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                padding: 16,
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>{s.value}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {menu.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as never)}
            style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                padding: 16,
                marginBottom: 8,
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <item.icon size={20} color={colors.primary} />
              </View>
              <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500', color: colors.ink }}>
                {item.label}
              </Text>
              {item.badge ? (
                <View
                  style={{
                    backgroundColor: colors.error,
                    borderRadius: 9999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{item.badge}</Text>
                </View>
              ) : null}
              <CaretRight size={18} color={colors.muted} />
            </View>
          </Pressable>
        ))}
      </View>
    </PageScaffold>
  );
}
