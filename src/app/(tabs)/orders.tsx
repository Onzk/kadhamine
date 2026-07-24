import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Lock, ClipboardText, CheckCircle } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/ThemedText';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { OrderCard, OrderCardSkeleton } from '@/components/cards/OrderCard';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'cancelled'] as const;

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const role = user?.role === 'provider' ? 'provider' : 'client';
  const orders = useQuery(api.orders.listMine, user ? { role } : 'skip');
  const respond = useMutation(api.orders.respond);
  const complete = useMutation(api.orders.complete);
  const validate = useMutation(api.orders.validate);

  const handleRespond = async (orderId: string, accept: boolean) => {
    await respond({ orderId: orderId as never, accept });
  };

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
            ({ order, service, payment, hasReview, counterpartyName, counterpartyAvatar }) => {
              const actions: React.ReactNode[] = [];

              if (role === 'client' && ['pending', 'accepted'].includes(order.status)) {
                if (!payment || payment.status === 'pending' || payment.status === 'failed') {
                  actions.push(
                    <AuthPrimaryButton
                      key="pay"
                      title={t('payment.pay')}
                      onPress={() => router.push(`/checkout/${order._id}`)}
                      tone="ink"
                      backgroundColor={isDark ? '#FFFFFF' : undefined}
                      textColor={isDark ? BrandColors.ink : undefined}
                      flat
                    />,
                  );
                }
              }

              if (role === 'provider' && order.status === 'pending') {
                actions.push(
                  <View key="respond" style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <View style={{ flex: 1 }}>
                      <AuthPrimaryButton
                        title={t('orders.accept')}
                        onPress={() => handleRespond(order._id, true)}
                        tone="orbit"
                        flat
                        fill
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title={t('orders.reject')}
                        variant="outline"
                        onPress={() => handleRespond(order._id, false)}
                        fullWidth
                      />
                    </View>
                  </View>,
                );
              }

              if (role === 'provider' && order.status === 'accepted') {
                actions.push(
                  <AuthPrimaryButton
                    key="complete"
                    title={t('orders.complete')}
                    onPress={() => complete({ orderId: order._id })}
                    tone="orbit"
                    flat
                    icon={<CheckCircle size={18} weight="bold" />}
                  />,
                );
              }

              if (role === 'client' && order.status === 'completed' && payment?.status === 'held') {
                actions.push(
                  <AuthPrimaryButton
                    key="validate"
                    title={t('orders.validate')}
                    onPress={() => validate({ orderId: order._id })}
                    tone="orbit"
                    flat
                  />,
                );
              }

              if (role === 'client' && order.status === 'completed' && order.canReview && !hasReview) {
                actions.push(
                  <Button
                    key="review"
                    title={t('reviews.leaveReview')}
                    variant={payment?.status === 'held' ? 'outline' : 'primary'}
                    onPress={() => router.push(`/review/${order._id}`)}
                    fullWidth
                  />,
                );
              }

              if (role === 'client' && order.status === 'completed' && order.canReview && hasReview) {
                actions.push(
                  <Text
                    key="thanks"
                    style={[textStyle('caption'), { color: colors.success, textAlign: 'center' }]}
                  >
                    {t('reviews.thanks')}
                  </Text>,
                );
              }

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
                    role === 'client' ? t('orders.provider') : t('orders.client')
                  }
                  createdAt={order.createdAt}
                  deliveryDate={order.deliveryDate}
                  paymentStatus={payment?.status}
                  isOffPlatform={order.isOffPlatformPayment}
                  onPress={() => router.push(`/order/${order._id}`)}
                  actions={actions.length > 0 ? actions : undefined}
                />
              );
            },
          )
        )}
      </View>
    </PageScaffold>
  );
}
