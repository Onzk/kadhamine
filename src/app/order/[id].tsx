import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import {
  CheckCircle,
  MapPin,
  WarningCircle,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { VoiceRecorderField } from '@/components/orders/VoiceRecorderField';
import {
  LeafletMapView,
  MAP_PICKER_ZOOM,
  type LeafletMapTheme,
} from '@/components/map/LeafletMapView';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { BorderWidth, BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const STATUS_COLORS: Record<string, 'default' | 'verified' | 'premium' | 'danger' | 'accent'> = {
  pending: 'accent',
  accepted: 'verified',
  completed: 'default',
  cancelled: 'danger',
};

function formatDate(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const detail = useQuery(
    api.orders.getById,
    user && id ? { orderId: id as Id<'orders'> } : 'skip',
  );

  const respond = useMutation(api.orders.respond);
  const complete = useMutation(api.orders.complete);
  const validate = useMutation(api.orders.validate);
  const cancel = useMutation(api.orders.cancel);

  const mapTheme = useMemo<LeafletMapTheme>(
    () => ({
      surface: colors.surface,
      surfaceStrong: colors.surfaceStrong,
      ink: colors.ink,
      muted: colors.muted,
      border: colors.borderStrong,
      orbit: colors.orbit,
      rating: colors.warning,
      info: colors.info,
    }),
    [colors],
  );

  if (!user) {
    return (
      <PageScaffold title={t('order.detailTitle')} subtitle={t('order.detailSubtitle')} showBack>
        <EmptyState
          title={t('auth.loginRequiredTitle')}
          description={t('orders.loginRequired')}
          actionLabel={t('auth.signIn')}
          onAction={() => router.push('/(auth)/login')}
        />
      </PageScaffold>
    );
  }

  if (detail === undefined) {
    return (
      <PageScaffold title={t('order.detailTitle')} subtitle={t('order.detailSubtitle')} showBack>
        <View style={{ padding: Spacing.eight, alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>{t('common.loading')}</Text>
        </View>
      </PageScaffold>
    );
  }

  if (detail === null) {
    return (
      <PageScaffold title={t('order.detailTitle')} subtitle={t('order.detailSubtitle')} showBack>
        <EmptyState
          icon={WarningCircle}
          title={t('orders.empty')}
          description={t('payment.orderNotFound')}
          actionLabel={t('orders.title')}
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </PageScaffold>
    );
  }

  const {
    order,
    service,
    payment,
    hasReview,
    viewerRole,
    counterpartyName,
    counterpartyAvatar,
    photoUrls,
    voiceUrl,
  } = detail;

  const isClient = viewerRole === 'client';
  const hasCoords =
    typeof order.latitude === 'number' &&
    typeof order.longitude === 'number' &&
    Number.isFinite(order.latitude) &&
    Number.isFinite(order.longitude);

  const needsPayment =
    isClient &&
    ['pending', 'accepted'].includes(order.status) &&
    (!payment || payment.status === 'pending' || payment.status === 'failed');

  const mapHeight = Math.min(220, Math.round(width * 0.55));

  const handleCancel = () => {
    confirm({
      title: t('order.cancelConfirmTitle'),
      message: t('order.cancelConfirmBody'),
      destructive: true,
      confirmLabel: t('orders.cancel'),
      onConfirm: async () => {
        await cancel({ orderId: order._id });
      },
    });
  };

  const handleReject = () => {
    confirm({
      title: t('order.rejectConfirmTitle'),
      message: t('order.rejectConfirmBody'),
      destructive: true,
      confirmLabel: t('orders.reject'),
      onConfirm: async () => {
        await respond({ orderId: order._id, accept: false });
      },
    });
  };

  const openMaps = () => {
    if (!hasCoords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
    void Linking.openURL(url);
  };

  return (
    <PageScaffold
      title={t('order.detailTitle')}
      subtitle={
        isClient ? t('order.detailSubtitleClient') : t('order.detailSubtitleProvider')
      }
      showBack
      contentContainerStyle={{ paddingBottom: Spacing.twelve }}
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.five }}>
        {/* Header card */}
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            borderWidth: BorderWidth.default,
            borderColor: colors.borderStrong,
            padding: Spacing.five,
            gap: Spacing.three,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: Spacing.three,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 18,
                lineHeight: 24,
                color: colors.ink,
                flex: 1,
              }}
            >
              {order.title}
            </Text>
            <Badge
              label={t(`orders.${order.status}`)}
              variant={STATUS_COLORS[order.status] ?? 'default'}
            />
          </View>

          {order.agreedPrice != null ? (
            <Text
              style={{
                fontFamily: fontFamily('display', 'medium'),
                fontSize: 28,
                color: colors.ink,
              }}
            >
              {formatPrice(order.agreedPrice)}
            </Text>
          ) : null}

          <Text style={[textStyle('micro'), { color: colors.muted }]}>
            {formatDate(order.createdAt, i18n.language)}
          </Text>

          {payment?.status ? (
            <Badge
              label={t(`payment.${payment.status}`, { defaultValue: payment.status })}
              variant={
                payment.status === 'held'
                  ? 'verified'
                  : payment.status === 'failed' || payment.status === 'refunded'
                    ? 'danger'
                    : 'accent'
              }
            />
          ) : null}
        </View>

        {/* Counterparty */}
        <Section title={isClient ? t('orders.provider') : t('orders.client')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: 'hidden',
                backgroundColor: colors.iconWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {counterpartyAvatar ? (
                <Image
                  source={{ uri: counterpartyAvatar }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text style={[textStyle('body'), { color: colors.ink }]}>
                  {(counterpartyName || 'T').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 16,
                  color: colors.ink,
                }}
              >
                {counterpartyName || t('profile.defaultName')}
              </Text>
              {service ? (
                <Text style={[textStyle('micro'), { color: colors.muted }]} numberOfLines={1}>
                  {service.city}
                  {service.region ? ` · ${service.region}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        </Section>

        {/* Request metadata */}
        <Section title={t('order.requestDetails')}>
          <Text style={[textStyle('body'), { color: colors.body }]}>
            {order.description?.trim() || t('order.notProvided')}
          </Text>
        </Section>

        {hasCoords ? (
          <Section title={t('order.locationLabel')}>
            <View
              style={{
                height: mapHeight,
                borderRadius: Radius.lg,
                overflow: 'hidden',
                borderWidth: BorderWidth.default,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surfaceStrong,
              }}
            >
              <LeafletMapView
                center={{ lat: order.latitude!, lng: order.longitude! }}
                zoom={MAP_PICKER_ZOOM}
                markers={[
                  {
                    id: order._id,
                    lat: order.latitude!,
                    lng: order.longitude!,
                    selected: true,
                  },
                ]}
                orbitColor={colors.orbit}
                theme={mapTheme}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <Pressable
              onPress={openMaps}
              style={({ pressed }) => ({ minHeight: 44, opacity: pressed ? 0.8 : 1 })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.two,
                  paddingVertical: Spacing.two,
                }}
              >
                <MapPin size={16} color={colors.orbit} weight="fill" />
                <Text style={[textStyle('caption'), { color: colors.link }]}>
                  {order.latitude!.toFixed(5)}, {order.longitude!.toFixed(5)}
                </Text>
              </View>
            </Pressable>
          </Section>
        ) : null}

        {photoUrls.length > 0 ? (
          <Section title={t('order.photosLabel')}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.two }}
            >
              {photoUrls.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: Radius.sm,
                    backgroundColor: colors.surfaceStrong,
                  }}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </Section>
        ) : null}

        {voiceUrl ? (
          <Section title={t('order.voiceLabel')}>
            <VoiceRecorderField
              value={null}
              onChange={() => {}}
              readOnly
              playbackUri={voiceUrl}
              playbackDurationMs={order.voiceDurationMs}
            />
          </Section>
        ) : null}

        {order.isOffPlatformPayment ? (
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.two,
              padding: Spacing.four,
              borderRadius: Radius.lg,
              backgroundColor: colors.error + '12',
              borderWidth: BorderWidth.default,
              borderColor: colors.error + '30',
            }}
          >
            <WarningCircle size={18} color={colors.error} weight="fill" />
            <Text style={[textStyle('micro'), { color: colors.error, flex: 1 }]}>
              {t('payment.offPlatformWarning')}
            </Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={{ gap: Spacing.two }}>
          {needsPayment ? (
            <AuthPrimaryButton
              title={t('payment.pay')}
              onPress={() => router.push(`/checkout/${order._id}`)}
              tone="ink"
              backgroundColor={isDark ? '#FFFFFF' : undefined}
              textColor={isDark ? BrandColors.ink : undefined}
              flat
            />
          ) : null}

          {!isClient && order.status === 'pending' ? (
            <>
              <AuthPrimaryButton
                title={t('orders.accept')}
                onPress={() => respond({ orderId: order._id, accept: true })}
                tone="orbit"
                flat
              />
              <Button title={t('orders.reject')} variant="outline" onPress={handleReject} fullWidth />
            </>
          ) : null}

          {!isClient && order.status === 'accepted' ? (
            <AuthPrimaryButton
              title={t('orders.complete')}
              onPress={() => complete({ orderId: order._id })}
              tone="orbit"
              flat
              icon={<CheckCircle size={18} weight="bold" />}
            />
          ) : null}

          {isClient && order.status === 'completed' && payment?.status === 'held' ? (
            <AuthPrimaryButton
              title={t('orders.validate')}
              onPress={() => validate({ orderId: order._id })}
              tone="orbit"
              flat
            />
          ) : null}

          {isClient && order.status === 'completed' && order.canReview && !hasReview ? (
            <Button
              title={t('reviews.leaveReview')}
              variant="outline"
              onPress={() => router.push(`/review/${order._id}`)}
              fullWidth
            />
          ) : null}

          {isClient && order.status === 'completed' && order.canReview && hasReview ? (
            <Text style={[textStyle('caption'), { color: colors.success, textAlign: 'center' }]}>
              {t('reviews.thanks')}
            </Text>
          ) : null}

          {['pending', 'accepted'].includes(order.status) ? (
            <Button
              title={t('orders.cancel')}
              variant="ghost"
              onPress={handleCancel}
              fullWidth
            />
          ) : null}
        </View>
      </View>
    </PageScaffold>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: Spacing.three }}>
      <Text
        style={{
          fontFamily: fontFamily('body', 'medium'),
          fontSize: 16,
          color: colors.ink,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
