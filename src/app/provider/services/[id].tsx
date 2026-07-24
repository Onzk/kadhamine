import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { PencilSimple, ClipboardText, Briefcase } from 'phosphor-react-native';
import type { Id } from '../../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/FilterChip';
import { SearchBar } from '@/components/ui/SearchBar';
import { OrderCard, OrderCardSkeleton } from '@/components/cards/OrderCard';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'cancelled'] as const;

export default function ProviderServiceDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = id as Id<'services'>;

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const data = useQuery(api.services.getById, serviceId ? { serviceId } : 'skip');
  const orders = useQuery(
    api.orders.listByService,
    serviceId ? { serviceId } : 'skip',
  );

  const service = data?.service;
  const category = data?.category;
  const isOwner = service?.providerId === user?._id;

  const filtered = useMemo(() => {
    if (!orders) return orders;
    const byStatus =
      filter === 'all' ? orders : orders.filter(({ order }) => order.status === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(({ order, clientProfile, clientUser }) => {
      const clientName = clientProfile
        ? `${clientProfile.firstName} ${clientProfile.lastName}`.trim()
        : clientUser?.name ?? '';
      const hay = [order.title, order.description, clientName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, query]);

  if (data === undefined) {
    return (
      <PageScaffold title={t('common.services')} subtitle={t('common.loading')} showBack>
        <View style={{ padding: PAGE_H_PAD, paddingTop: Spacing.six }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            {t('common.loading')}
          </Text>
        </View>
      </PageScaffold>
    );
  }

  if (!service || !isOwner) {
    return (
      <PageScaffold
        title={t('common.services')}
        subtitle={t('services.detailUnavailable')}
        showBack
      >
        <View style={{ padding: PAGE_H_PAD }}>
          <EmptyState
            icon={Briefcase}
            title={t('common.error')}
            description={t('services.detailUnavailable')}
          />
        </View>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title={service.title}
      subtitle={category?.nameFr ?? t('services.detailSubtitle')}
      showBack
      contentContainerStyle={{ paddingBottom: Spacing.fifteen }}
      rightAction={
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/provider/services/form',
              params: { id: service._id },
            })
          }
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            opacity: pressed ? 0.85 : 1,
          })}
          accessibilityLabel={t('services.edit')}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: Radius.md,
              backgroundColor: colors.orbitWash,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PencilSimple size={20} color={colors.orbit} weight="bold" />
          </View>
        </Pressable>
      }
      headerActions={
        <View style={{ gap: Spacing.three }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('orders.searchPlaceholder')}
            height={48}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.two }}
          >
            {FILTERS.map((f) => (
              <FilterChip
                key={f}
                label={f === 'all' ? t('common.all') : t(`orders.${f}`)}
                selected={filter === f}
                onPress={() => setFilter(f)}
                compact
              />
            ))}
          </ScrollView>
        </View>
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.three }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            padding: Spacing.five,
            borderWidth: 0.1,
            borderColor: colors.border,
            marginBottom: Spacing.two,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.three,
            }}
          >
            <Badge
              label={service.isActive ? t('services.active') : t('services.paused')}
              variant={service.isActive ? 'verified' : 'danger'}
            />
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {t('services.orderCount', { count: service.orderCount ?? 0 })}
            </Text>
          </View>

          <Text style={[textStyle('body'), { color: colors.body, lineHeight: 22 }]}>
            {service.description}
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.orbit,
              marginTop: Spacing.four,
            }}
          >
            {service.price != null
              ? formatPrice(service.price)
              : t('common.negotiable')}
          </Text>
        </View>

        <Text
          style={[
            textStyle('body'),
            {
              color: colors.ink,
              fontWeight: '700',
              marginBottom: Spacing.one,
            },
          ]}
        >
          {t('services.ordersSection')}
        </Text>

        {orders === undefined ? (
          <>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </>
        ) : filtered?.length === 0 ? (
          <EmptyState
            icon={ClipboardText}
            title={t('orders.empty')}
            description={
              query.trim() || filter !== 'all'
                ? t('orders.emptyFilter')
                : t('services.ordersEmptyDesc')
            }
            compact
            actionLabel={query.trim() || filter !== 'all' ? t('common.all') : undefined}
            onAction={
              query.trim() || filter !== 'all'
                ? () => {
                    setFilter('all');
                    setQuery('');
                  }
                : undefined
            }
            actionVariant="outline"
          />
        ) : (
          filtered?.map(({ order, clientProfile, clientUser, payment }) => {
            const clientName = clientProfile
              ? `${clientProfile.firstName} ${clientProfile.lastName}`.trim()
              : clientUser?.name ?? t('profile.defaultName');

            return (
              <OrderCard
                key={order._id}
                title={order.title}
                status={order.status}
                agreedPrice={order.agreedPrice}
                description={order.description}
                counterpartyName={clientName}
                counterpartyAvatar={clientProfile?.avatarUrl}
                counterpartyLabel={t('orders.client')}
                createdAt={order.createdAt}
                deliveryDate={order.deliveryDate}
                paymentStatus={payment?.status}
                isOffPlatform={order.isOffPlatformPayment}
                onPress={() => router.push(`/order/${order._id}`)}
              />
            );
          })
        )}
      </View>
    </PageScaffold>
  );
}
