import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
  const { colors } = useAppTheme();
  const router = useRouter();
  const stats = useQuery(api.admin.dashboard);

  const menu = [
    { icon: UsersThree, label: 'Utilisateurs', route: '/admin/users', badge: stats?.pendingProviders },
    { icon: Shield, label: 'Vérifications', route: '/admin/verifications', badge: stats?.pendingVerifications },
    { icon: Warning, label: 'Litiges', route: '/admin/reports', badge: stats?.openReports },
    { icon: Star, label: 'Modération avis', route: '/admin/reviews' },
    { icon: CreditCard, label: 'Paiements', route: '/admin/payments' },
    { icon: Gear, label: 'Paramètres', route: '/admin/settings' },
  ];

  return (
    <PageScaffold title="Administration" showBack>
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            backgroundColor: BrandColors.ink,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#FFFFFF99', fontSize: 13 }}>Revenus plateforme</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 4 }}>
            {formatPrice(stats?.totalRevenue ?? 0)}
          </Text>
          <Text style={{ color: BrandColors.gold, fontSize: 13, marginTop: 8 }}>
            Volume: {formatPrice(stats?.totalVolume ?? 0)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Utilisateurs', value: stats?.totalUsers ?? 0 },
            { label: 'Prestataires', value: stats?.totalProviders ?? 0 },
            { label: 'Commandes', value: stats?.totalOrders ?? 0 },
            { label: 'Premium', value: stats?.activePremium ?? 0 },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                width: '47%',
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
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
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              padding: 16,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
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
          </Pressable>
        ))}
      </View>
    </PageScaffold>
  );
}
