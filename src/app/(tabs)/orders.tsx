import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { Lock, ClipboardText, TrayArrowDown, PaperPlaneRight } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChip } from '@/components/ui/FilterChip';
import { SearchBar } from '@/components/ui/SearchBar';
import { OrderCard, OrderCardSkeleton, orderNeedsPayment } from '@/components/cards/OrderCard';
import {
  AnimatedExtendedFab,
  useScrollExpandedFab,
} from '@/components/ui/AnimatedExtendedFab';
import { FLUTTER_FAB } from '@/components/ui/FlutterFab';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'cancelled'] as const;

/** Provider list mode: received (as provider) vs sent (as client). */
type ProviderListMode = 'received' | 'sent';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');
  const [providerMode, setProviderMode] = useState<ProviderListMode>('received');
  const { expanded, onScrollY } = useScrollExpandedFab();

  const isProvider = user?.role === 'provider';
  /** Clients always see emitted orders; providers default to received. */
  const listRole: 'client' | 'provider' =
    isProvider && providerMode === 'received' ? 'provider' : 'client';

  const orders = useQuery(api.orders.listMine, user ? { role: listRole } : 'skip');

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

  const switchToSent = providerMode === 'received';
  const fabLabel = switchToSent ? t('orders.sent') : t('orders.received');
  const FabIcon = switchToSent ? PaperPlaneRight : TrayArrowDown;

  return (
    <View style={{ flex: 1 }}>
      <PageScaffold
        title={t('orders.title')}
        subtitle={
          isProvider
            ? providerMode === 'received'
              ? t('orders.subtitleReceived')
              : t('orders.subtitleSent')
            : t('orders.subtitle')
        }
        bottomInset={false}
        onScrollYChange={isProvider ? onScrollY : undefined}
        contentContainerStyle={
          isProvider ? { paddingBottom: Spacing.fourteen } : undefined
        }
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
                  : isProvider && providerMode === 'received'
                    ? t('orders.emptyReceived')
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
              ({ order, service, payment, counterpartyName, counterpartyAvatar }, index) => {
                const showPay =
                  listRole === 'client' &&
                  orderNeedsPayment({
                    status: order.status,
                    paymentStatus: payment?.status,
                    paymentMethod: payment?.method,
                    isOffPlatform: order.isOffPlatformPayment,
                  });
                return (
                  <OrderCard
                    key={order._id}
                    title={order.title}
                    status={order.status}
                    agreedPrice={order.agreedPrice}
                    description={service?.description ?? order.description}
                    counterpartyName={counterpartyName}
                    counterpartyAvatar={counterpartyAvatar}
                    counterpartyLabel={
                      listRole === 'client' ? t('orders.provider') : t('orders.client')
                    }
                    createdAt={order.createdAt}
                    deliveryDate={order.deliveryDate}
                    paymentStatus={payment?.status}
                    isOffPlatform={order.isOffPlatformPayment}
                    showPay={showPay}
                    enterIndex={index}
                    onPay={
                      showPay ? () => router.push(`/checkout/${order._id}`) : undefined
                    }
                    onPress={() => router.push(`/order/${order._id}`)}
                  />
                );
              },
            )
          )}
        </View>
      </PageScaffold>

      {isProvider ? (
        <AnimatedExtendedFab
          expanded={expanded}
          label={fabLabel}
          onPress={() =>
            setProviderMode((m) => (m === 'received' ? 'sent' : 'received'))
          }
          icon={<FabIcon size={24} color={colors.onOrbit} weight="fill" />}
          backgroundColor={colors.orbit}
          foregroundColor={colors.onOrbit}
          bottom={FLUTTER_FAB.edgeMargin}
          right={FLUTTER_FAB.edgeMargin}
          accessibilityLabel={fabLabel}
        />
      ) : null}
    </View>
  );
}
