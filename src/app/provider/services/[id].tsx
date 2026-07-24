import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import {
  PencilSimple,
  ClipboardText,
  Briefcase,
  CheckCircle,
} from 'phosphor-react-native';
import type { Id } from '../../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

const STATUS_COLORS: Record<string, 'default' | 'verified' | 'premium' | 'danger' | 'accent'> = {
  pending: 'accent',
  accepted: 'verified',
  completed: 'default',
  cancelled: 'danger',
};

export default function ProviderServiceDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = id as Id<'services'>;

  const data = useQuery(api.services.getById, serviceId ? { serviceId } : 'skip');
  const orders = useQuery(
    api.orders.listByService,
    serviceId ? { serviceId } : 'skip',
  );
  const respond = useMutation(api.orders.respond);
  const complete = useMutation(api.orders.complete);

  const service = data?.service;
  const category = data?.category;
  const isOwner = service?.providerId === user?._id;

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
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            padding: Spacing.five,
            borderWidth: 0.1,
            borderColor: colors.border,
            marginBottom: Spacing.five,
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
              marginBottom: Spacing.three,
            },
          ]}
        >
          {t('services.ordersSection')}
        </Text>

        {orders === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 16 }}>
            {t('common.loading')}
          </Text>
        ) : orders === null || orders.length === 0 ? (
          <EmptyState
            icon={ClipboardText}
            title={t('orders.empty')}
            description={t('services.ordersEmptyDesc')}
            compact
          />
        ) : (
          orders.map(({ order, clientProfile, clientUser }) => {
            const clientName = clientProfile
              ? `${clientProfile.firstName} ${clientProfile.lastName}`.trim()
              : clientUser?.name ?? t('profile.defaultName');

            return (
              <View
                key={order._id}
                style={{
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.lg,
                  padding: Spacing.five,
                  marginBottom: Spacing.three,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        textStyle('body'),
                        { fontWeight: '600', color: colors.ink },
                      ]}
                    >
                      {clientName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Badge
                    label={t(`orders.${order.status}`)}
                    variant={STATUS_COLORS[order.status] ?? 'default'}
                  />
                </View>

                {order.agreedPrice != null ? (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: colors.ink,
                      marginBottom: 8,
                    }}
                  >
                    {formatPrice(order.agreedPrice)}
                  </Text>
                ) : null}

                {order.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <AuthPrimaryButton
                        title={t('orders.accept')}
                        onPress={() => respond({ orderId: order._id, accept: true })}
                        tone="orbit"
                        flat
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title={t('orders.reject')}
                        variant="outline"
                        onPress={() => respond({ orderId: order._id, accept: false })}
                        fullWidth
                      />
                    </View>
                  </View>
                ) : null}

                {order.status === 'accepted' ? (
                  <View style={{ marginTop: 4 }}>
                    <AuthPrimaryButton
                      title={t('orders.complete')}
                      onPress={() => complete({ orderId: order._id })}
                      tone="orbit"
                      flat
                      icon={<CheckCircle size={18} color={colors.onOrbit} weight="bold" />}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </PageScaffold>
  );
}
