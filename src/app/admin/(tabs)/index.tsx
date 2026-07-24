import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { Warning, Gear, CaretRight, SquaresFour, CreditCard, ClipboardText } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminAvatar,
  AdminIconWash,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  displayName,
  initialsFromName,
  adminRoleLabel,
  adminUserStatusLabel,
  adminPaymentStatusLabel,
  formatAdminDate,
  useAdminTabBarPadding,
} from '@/components/admin/adminUi';
import { Badge } from '@/components/ui/Badge';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const { contentPaddingBottom } = useAdminTabBarPadding();
  const stats = useQuery(api.admin.dashboard);
  const feed = useQuery(api.admin.dashboardFeed);

  const [selectedPayment, setSelectedPayment] = useState<
    NonNullable<typeof feed>['recentPayments'][number] | null
  >(null);

  const tools = [
    {
      icon: ClipboardText,
      label: t('admin.menuOrders'),
      route: '/admin/orders' as const,
      badge: undefined as number | undefined,
    },
    {
      icon: SquaresFour,
      label: t('admin.menuCategories'),
      route: '/admin/categories' as const,
      badge: undefined as number | undefined,
    },
    {
      icon: Warning,
      label: t('admin.menuReports'),
      route: '/admin/reports' as const,
      badge: stats?.openReports,
    },
    {
      icon: Gear,
      label: t('admin.menuSettings'),
      route: '/admin/settings' as const,
      badge: undefined as number | undefined,
    },
  ];

  const revenueCardStyle = {
    borderRadius: Radius.lg,
    padding: Spacing.five,
  } as const;

  const revenueBody = (
    <>
      <Text style={{ color: '#FFFFFF99', fontSize: 13 }}>{t('admin.revenue')}</Text>
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 28,
          fontFamily: fontFamily('body', 'bold'),
          marginTop: Spacing.one,
        }}
      >
        {formatPrice(stats?.totalRevenue ?? 0)}
      </Text>
      <Text style={{ color: BrandColors.gold, fontSize: 13, marginTop: Spacing.two }}>
        {t('admin.volume')}: {formatPrice(stats?.totalVolume ?? 0)}
      </Text>
    </>
  );

  return (
    <PageScaffold
      title={t('admin.dashboardTitle')}
      subtitle={t('admin.dashboardSubtitle')}
      showBack
      bottomInset={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.five }}>
        {isDark ? (
          <LinearGradient
            colors={[...colors.orbitGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={revenueCardStyle}
          >
            {revenueBody}
          </LinearGradient>
        ) : (
          <View style={[revenueCardStyle, { backgroundColor: BrandColors.ink }]}>{revenueBody}</View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.twoHalf }}>
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
                borderRadius: Radius.lg,
                padding: Spacing.five,
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: fontFamily('body', 'bold'),
                  color: colors.primary,
                }}
              >
                {s.value}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: Spacing.one }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: Spacing.two }}>
          <Text
            style={[
              textStyle('micro'),
              {
                fontFamily: fontFamily('body', 'medium'),
                color: colors.muted,
                textTransform: 'uppercase',
              },
            ]}
          >
            {t('admin.moreTools')}
          </Text>
          {tools.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.lg,
                  padding: Spacing.five,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: Radius.md,
                    backgroundColor: colors.iconWash,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon size={20} color={colors.primary} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    marginLeft: Spacing.three,
                    fontSize: 15,
                    fontFamily: fontFamily('body', 'medium'),
                    color: colors.ink,
                  }}
                >
                  {item.label}
                </Text>
                {item.badge ? (
                  <View
                    style={{
                      backgroundColor: colors.error,
                      borderRadius: Radius.pill,
                      paddingHorizontal: Spacing.two,
                      paddingVertical: Spacing.half,
                      marginRight: Spacing.two,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.onAccent,
                        fontSize: 11,
                        fontFamily: fontFamily('body', 'bold'),
                      }}
                    >
                      {item.badge}
                    </Text>
                  </View>
                ) : null}
                <CaretRight size={18} color={colors.muted} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: Spacing.three }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={[
                textStyle('micro'),
                {
                  fontFamily: fontFamily('body', 'medium'),
                  color: colors.muted,
                  textTransform: 'uppercase',
                },
              ]}
            >
              {t('admin.pendingUsersSection')}
            </Text>
            <Pressable
              onPress={() => router.push('/admin/users')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text style={[textStyle('caption'), { color: colors.primary }]}>
                {t('admin.seeAllUsers')}
              </Text>
            </Pressable>
          </View>

          {feed === undefined ? (
            <Text style={{ color: colors.muted }}>{t('common.loading')}</Text>
          ) : feed.pendingUsers.length === 0 ? (
            <Text style={{ color: colors.muted }}>{t('admin.pendingUsersEmpty')}</Text>
          ) : (
            feed.pendingUsers.map(({ user, profile }) => {
              const name = displayName({ profile, user });
              return (
                <AdminListCard
                  key={user._id}
                  onPress={() => router.push('/admin/users')}
                  leading={
                    <AdminAvatar
                      uri={profile?.avatarUrl ?? user.image}
                      initials={initialsFromName(name)}
                    />
                  }
                  title={name}
                  subtitle={user.email ?? undefined}
                  meta={
                    profile?.city
                      ? [profile.city, profile.region].filter(Boolean).join(' · ')
                      : undefined
                  }
                  badges={
                    <>
                      <Badge label={adminRoleLabel(t, user.role)} />
                      <AdminStatusBadge
                        label={adminUserStatusLabel(t, user.status)}
                        status={user.status}
                      />
                    </>
                  }
                />
              );
            })
          )}
        </View>

        <View style={{ gap: Spacing.three }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={[
                textStyle('micro'),
                {
                  fontFamily: fontFamily('body', 'medium'),
                  color: colors.muted,
                  textTransform: 'uppercase',
                },
              ]}
            >
              {t('admin.recentPaymentsSection')}
            </Text>
            <Pressable
              onPress={() => router.push('/admin/payments')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text style={[textStyle('caption'), { color: colors.primary }]}>
                {t('admin.seeAllPayments')}
              </Text>
            </Pressable>
          </View>

          {feed === undefined ? (
            <Text style={{ color: colors.muted }}>{t('common.loading')}</Text>
          ) : feed.recentPayments.length === 0 ? (
            <Text style={{ color: colors.muted }}>{t('admin.recentPaymentsEmpty')}</Text>
          ) : (
            feed.recentPayments.map((row) => {
              const { payment, order, client, provider } = row;
              return (
                <AdminListCard
                  key={payment._id}
                  onPress={() => setSelectedPayment(row)}
                  leading={<AdminIconWash icon={CreditCard} />}
                  title={order?.title ?? '—'}
                  subtitle={`${client?.name || client?.email || '—'} → ${provider?.name || provider?.email || '—'}`}
                  meta={`${t('admin.commission')}: ${formatPrice(payment.commission)} · ${formatAdminDate(payment.createdAt, i18n.language)}`}
                  badges={
                    <>
                      <Badge label={formatPrice(payment.amount)} />
                      <AdminStatusBadge
                        label={adminPaymentStatusLabel(t, payment.status)}
                        status={payment.status}
                      />
                    </>
                  }
                />
              );
            })
          )}
        </View>
      </View>

      <AppBottomSheet
        visible={selectedPayment != null}
        onClose={() => setSelectedPayment(null)}
        title={t('admin.paymentDetailTitle')}
        subtitle={selectedPayment?.order?.title}
      >
        {selectedPayment ? (
          <>
            <AdminDetailSection title={t('admin.detailPayment')}>
              <AdminDetailRow
                label={t('admin.detailAmount')}
                value={formatPrice(selectedPayment.payment.amount)}
              />
              <AdminDetailRow
                label={t('admin.detailProviderAmount')}
                value={formatPrice(selectedPayment.payment.providerAmount)}
              />
              <AdminDetailRow
                label={t('admin.detailCommission')}
                value={formatPrice(selectedPayment.payment.commission)}
              />
              <AdminDetailRow
                label={t('admin.detailStatus')}
                value={adminPaymentStatusLabel(t, selectedPayment.payment.status)}
              />
              <AdminDetailRow
                label={t('admin.detailMethod')}
                value={selectedPayment.payment.method}
              />
              <AdminDetailRow
                label={t('admin.detailCurrency')}
                value={selectedPayment.payment.currency}
              />
              <AdminDetailRow
                label={t('admin.detailRef')}
                value={selectedPayment.payment.fedapayReference}
              />
              <AdminDetailRow
                label={t('admin.detailTransactionId')}
                value={selectedPayment.payment.fedapayTransactionId}
              />
              <AdminDetailRow
                label={t('admin.detailCreated')}
                value={formatAdminDate(selectedPayment.payment.createdAt, i18n.language)}
              />
            </AdminDetailSection>
            <AdminDetailSection title={t('admin.detailOrder')}>
              <AdminDetailRow
                label={t('admin.detailClient')}
                value={selectedPayment.client?.name || selectedPayment.client?.email}
              />
              <AdminDetailRow
                label={t('admin.detailProvider')}
                value={selectedPayment.provider?.name || selectedPayment.provider?.email}
              />
            </AdminDetailSection>
          </>
        ) : null}
      </AppBottomSheet>
    </PageScaffold>
  );
}
