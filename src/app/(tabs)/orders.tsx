import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { api } from '../../../convex/_generated/api';

const STATUS_COLORS: Record<string, 'default' | 'verified' | 'premium' | 'danger' | 'accent'> = {
  pending: 'accent',
  accepted: 'verified',
  in_progress: 'verified',
  completed: 'default',
  cancelled: 'danger',
  rejected: 'danger',
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();

  const role = user?.role === 'provider' ? 'provider' : 'client';
  const orders = useQuery(api.orders.listMine, { role });
  const respond = useMutation(api.orders.respond);
  const startProgress = useMutation(api.orders.startProgress);
  const complete = useMutation(api.orders.complete);
  const validate = useMutation(api.orders.validate);

  const handleRespond = async (orderId: string, accept: boolean) => {
    await respond({ orderId: orderId as never, accept });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title={t('orders.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {orders === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : orders.length === 0 ? (
          <EmptyState icon="📋" title={t('orders.empty')} />
        ) : (
          orders.map(({ order, service, payment }) => (
            <View
              key={order._id}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 }}>
                  {order.title}
                </Text>
                <Badge
                  label={t(`orders.${order.status === 'in_progress' ? 'inProgress' : order.status}`)}
                  variant={STATUS_COLORS[order.status] ?? 'default'}
                />
              </View>

              {service && (
                <Text style={{ fontSize: 13, color: colors.body, marginBottom: 8 }}>
                  {service.description.slice(0, 80)}...
                </Text>
              )}

              {order.agreedPrice && (
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 8 }}>
                  {formatPrice(order.agreedPrice)}
                </Text>
              )}

              {order.isOffPlatformPayment && (
                <Text style={{ fontSize: 12, color: colors.error, marginBottom: 8 }}>
                  {t('payment.offPlatformWarning')}
                </Text>
              )}

              {role === 'provider' && order.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
              )}

              {role === 'provider' && order.status === 'accepted' && (
                <Button
                  title={t('orders.start')}
                  onPress={() => startProgress({ orderId: order._id })}
                  fullWidth
                  style={{ marginTop: 8 }}
                />
              )}

              {role === 'provider' && order.status === 'in_progress' && (
                <Button
                  title={t('orders.complete')}
                  onPress={() => complete({ orderId: order._id })}
                  fullWidth
                  style={{ marginTop: 8 }}
                />
              )}

              {role === 'client' && order.status === 'completed' && (
                <Button
                  title={t('orders.validate')}
                  onPress={() => validate({ orderId: order._id })}
                  fullWidth
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
