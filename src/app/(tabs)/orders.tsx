import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Lock, ClipboardText, Briefcase } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

const STATUS_COLORS: Record<string, 'default' | 'verified' | 'premium' | 'danger' | 'accent'> = {
  pending: 'accent',
  accepted: 'verified',
  completed: 'default',
  cancelled: 'danger',
};

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'cancelled'] as const;

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const role = user?.role === 'provider' ? 'provider' : 'client';
  const orders = useQuery(api.orders.listMine, user ? { role } : 'skip');
  const respond = useMutation(api.orders.respond);
  const complete = useMutation(api.orders.complete);
  const validate = useMutation(api.orders.validate);

  const handleRespond = async (orderId: string, accept: boolean) => {
    await respond({ orderId: orderId as never, accept });
  };

  const filtered =
    filter === 'all' ? orders : orders?.filter(({ order }) => order.status === filter);

  return (
    <PageScaffold
      title={t('orders.title')}
      subtitle="Suivez et gérez vos commandes en cours."
      bottomInset={false}
      headerActions={
        user ? (
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
              />
            ))}
          </ScrollView>
        ) : undefined
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.four }}>
        {!user ? (
          <EmptyState
            icon={Lock}
            title="Connexion requise"
            description="Connectez-vous pour voir et gérer vos commandes."
            actionLabel={t('auth.signIn')}
            onAction={() => router.push('/(auth)/login')}
          />
        ) : orders === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered?.length === 0 ? (
          <EmptyState
            icon={ClipboardText}
            title={t('orders.empty')}
            description={filter !== 'all' ? 'Aucune commande ne correspond à ce filtre.' : undefined}
            actionLabel={filter !== 'all' ? t('common.all') : undefined}
            onAction={filter !== 'all' ? () => setFilter('all') : undefined}
            actionVariant="outline"
          />
        ) : (
          filtered?.map(({ order, service, payment, hasReview }) => (
            <View
              key={order._id}
              style={{
                flexDirection: 'row',
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.stadium,
                padding: 24,
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Briefcase size={22} color={colors.ink} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, flex: 1, marginRight: 8 }}>
                    {order.title}
                  </Text>
                  <Badge
                    label={t(`orders.${order.status}`)}
                    variant={STATUS_COLORS[order.status] ?? 'default'}
                  />
                </View>

                {service ? (
                  <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }} numberOfLines={1}>
                    {service.description}
                  </Text>
                ) : null}

                {order.agreedPrice != null ? (
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
                    {formatPrice(order.agreedPrice)}
                  </Text>
                ) : null}

                {order.isOffPlatformPayment ? (
                  <Text style={{ fontSize: 12, color: colors.error, marginBottom: 8 }}>
                    {t('payment.offPlatformWarning')}
                  </Text>
                ) : null}

                {role === 'client' && ['pending', 'accepted'].includes(order.status) ? (
                  <Button
                    title={t('payment.pay')}
                    onPress={() => router.push(`/checkout/${order._id}`)}
                    fullWidth
                    style={{ marginTop: 4 }}
                  />
                ) : null}

                {role === 'provider' && order.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Button
                      title={t('orders.accept')}
                      onPress={() => handleRespond(order._id, true)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title={t('orders.reject')}
                      variant="outline"
                      onPress={() => handleRespond(order._id, false)}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}

                {role === 'provider' && order.status === 'accepted' ? (
                  <Button
                    title={t('orders.complete')}
                    onPress={() => complete({ orderId: order._id })}
                    fullWidth
                    style={{ marginTop: 4 }}
                  />
                ) : null}

                {role === 'client' &&
                order.status === 'completed' &&
                payment?.status === 'held' ? (
                  <Button
                    title={t('orders.validate')}
                    onPress={() => validate({ orderId: order._id })}
                    fullWidth
                    style={{ marginTop: 4 }}
                  />
                ) : null}

                {role === 'client' &&
                order.status === 'completed' &&
                order.canReview &&
                !hasReview ? (
                  <Button
                    title={t('reviews.leaveReview')}
                    variant={payment?.status === 'held' ? 'outline' : 'primary'}
                    onPress={() => router.push(`/review/${order._id}`)}
                    fullWidth
                    style={{ marginTop: 4 }}
                  />
                ) : null}

                {role === 'client' &&
                order.status === 'completed' &&
                order.canReview &&
                hasReview ? (
                  <Text style={{ fontSize: 12, color: colors.success, marginTop: 6 }}>
                    {t('reviews.thanks')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </PageScaffold>
  );
}
