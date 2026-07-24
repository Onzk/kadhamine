import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { Lock, ClipboardText } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChip } from '@/components/ui/FilterChip';
import { SearchBar } from '@/components/ui/SearchBar';
import { OrderCard, OrderCardSkeleton } from '@/components/cards/OrderCard';
import { useAuth } from '@/providers/AuthProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'cancelled'] as const;

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const role = user?.role === 'provider' ? 'provider' : 'client';
  const orders = useQuery(api.orders.listMine, user ? { role } : 'skip');

  const filtered = useMemo(() => {
    if (!orders) return orders;
    const byStatus = filter === 'all' ? orders : orders.filter(({ order }) => order.status === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(({ order, service, counterpartyName }) => {
      const hay = [
        order.title,
        order.description,
        service?.title,
        service?.description,
        counterpartyName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, query]);

  return (
    <PageScaffold
      title={t('orders.title')}
      subtitle={t('orders.subtitle')}
      bottomInset={false}
      headerActions={
        user ? (
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
        ) : undefined
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.three }}>
        {!user ? (
          <EmptyState
            icon={Lock}
            title={t('auth.loginRequiredTitle')}
            description={t('orders.loginRequired')}
            actionLabel={t('auth.signIn')}
            onAction={() => router.push('/(auth)/login')}
          />
        ) : orders === undefined ? (
          <>
            <OrderCardSkeleton />
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
                : t('orders.emptyDescription')
            }
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
          filtered?.map(
            ({ order, service, payment, counterpartyName, counterpartyAvatar }) => (
              <OrderCard
                key={order._id}
                title={order.title}
                status={order.status}
                agreedPrice={order.agreedPrice}
                description={service?.description ?? order.description}
                counterpartyName={counterpartyName}
                counterpartyAvatar={counterpartyAvatar}
                counterpartyLabel={
                  role === 'client' ? t('orders.provider') : t('orders.client')
                }
                createdAt={order.createdAt}
                deliveryDate={order.deliveryDate}
                paymentStatus={payment?.status}
                isOffPlatform={order.isOffPlatformPayment}
                onPress={() => router.push(`/order/${order._id}`)}
              />
            ),
          )
        )}
      </View>
    </PageScaffold>
  );
}
