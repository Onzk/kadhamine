import React, { useMemo, useState } from 'react';
import { View, Pressable, useWindowDimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  CheckCircle,
  MapPin,
  NavigationArrow,
  Prohibit,
  WarningCircle,
  X,
  type Icon,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { OrderStatusBadge, orderDisplayStatus } from '@/components/orders/OrderStatusBadge';
import { ServiceDetailSheet } from '@/components/orders/ServiceDetailSheet';
import { VoiceRecorderField } from '@/components/orders/VoiceRecorderField';
import { StarRating } from '@/components/ui/StarRating';
import { ImageZoomModal } from '@/components/chat/ImageZoomModal';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import {
  LeafletMapView,
  MAP_PICKER_ZOOM,
  type LeafletMapTheme,
} from '@/components/map/LeafletMapView';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { formatLocationLabel } from '@/utils/locationDisplay';
import { BorderWidth, BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const PHOTO_GAP = Spacing.two;
const PHOTO_COLS = 2;
const ACTION_BTN_H = 54;
const TOPBAR_ICON_SIZE = 44;
/** Extra scroll breathing room above the sticky footer (beyond footer clearance). */
const SCROLL_FOOTER_EXTRA = Spacing.twelve;
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
  const { id, fromPayment } = useLocalSearchParams<{
    id: string;
    fromPayment?: string;
  }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { confirm } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [zoomUri, setZoomUri] = useState<string | null>(null);
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);

  /** Après checkout : back → listing commandes (pile vidé). */
  const backToOrdersAfterPayment = fromPayment === '1';

  const goBack = () => {
    if (backToOrdersAfterPayment) {
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/(tabs)/orders');
      return;
    }
    router.back();
  };

  const detail = useQuery(
    api.orders.getById,
    user && id ? { orderId: id as Id<'orders'> } : 'skip',
  );

  const respond = useMutation(api.orders.respond);
  const complete = useMutation(api.orders.complete);
  const cancel = useMutation(api.orders.cancel);
  const refuseOffPlatform = useMutation(api.payments.refuseOffPlatform);

  const clientReviewEligibility = useQuery(
    api.reviews.getClientReviewEligibility,
    user && id && detail?.viewerRole === 'provider'
      ? { orderId: id as Id<'orders'> }
      : 'skip',
  );
  const clientReview = useQuery(
    api.reviews.getClientReviewByOrder,
    user && id ? { orderId: id as Id<'orders'> } : 'skip',
  );

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

  const contentWidth = Math.max(width - PAGE_H_PAD * 2, 1);
  const photoSize = Math.max(
    96,
    Math.floor((contentWidth - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS),
  );
  const [footerHeight, setFooterHeight] = useState(0);

  if (!user) {
    return (
      <PageScaffold
        title={t('order.detailTitle')}
        subtitle={t('order.detailSubtitle')}
        showBack
        onBack={goBack}
      >
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
      <PageScaffold
        title={t('order.detailTitle')}
        subtitle={t('order.detailSubtitle')}
        showBack
        onBack={goBack}
      >
        <View style={{ padding: Spacing.eight, alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>{t('common.loading')}</Text>
        </View>
      </PageScaffold>
    );
  }

  if (detail === null) {
    return (
      <PageScaffold
        title={t('order.detailTitle')}
        subtitle={t('order.detailSubtitle')}
        showBack
        onBack={goBack}
      >
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
    review: providerReview,
    viewerRole,
    canRefuseOffPlatform,
    counterpartyName,
    counterpartyAvatar,
    photoUrls: rawPhotoUrls,
    voiceUrl,
  } = detail;

  const photoUrls = (rawPhotoUrls ?? []).filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  );

  const isClient = viewerRole === 'client';
  const hasCoords =
    typeof order.latitude === 'number' &&
    typeof order.longitude === 'number' &&
    Number.isFinite(order.latitude) &&
    Number.isFinite(order.longitude);

  /**
   * Paiement (et marquage payé) uniquement une fois la prestation terminée.
   * Hors plateforme déjà déclaré : pas de re-paiement.
   */
  const needsPayment =
    isClient &&
    order.status === 'completed' &&
    (!payment ||
      payment.status === 'failed' ||
      (payment.status === 'pending' && payment.method !== 'off_platform'));

  const mapHeight = Math.min(220, Math.round(width * 0.55));

  const locationDisplay = formatLocationLabel(
    {
      addressLabel: order.addressLabel,
      city: order.city,
      region: order.region,
      latitude: order.latitude,
      longitude: order.longitude,
    },
    (lat, lng) => t('services.coordsSummary', { lat, lng }),
  );

  const showPay = needsPayment;
  const showAccept = !isClient && order.status === 'pending';
  const showReject = showAccept;
  const showComplete = !isClient && order.status === 'accepted';
  const showReview =
    isClient && order.status === 'completed' && order.canReview && !hasReview;
  const showCancel = ['pending', 'accepted'].includes(order.status);
  const showRateClient = Boolean(clientReviewEligibility?.canRate);
  /** Avis client→prestataire : masqué tant qu’il n’est pas validé par le paiement. */
  const showProviderNote = Boolean(providerReview && providerReview.isValid !== false);
  /** Source de vérité Convex (24 h / pending / hors plateforme). */
  const showRefuseOffPlatform = Boolean(canRefuseOffPlatform);
  /** Never show “released / paid” on UI until the order is completed. */
  const displayPaymentStatus =
    payment?.status === 'released' && order.status !== 'completed'
      ? 'pending'
      : payment?.status;
  const displayStatus = orderDisplayStatus(order.status, displayPaymentStatus);

  const footerActionCount =
    (showPay ? 1 : 0) +
    (showAccept ? 1 : 0) +
    (showComplete ? 1 : 0) +
    (showReview ? 1 : 0) +
    (showRefuseOffPlatform ? 1 : 0) +
    (showRateClient ? 1 : 0);
  const hasFooter = footerActionCount > 0;
  /** Reject / cancel stay in the top bar only. */
  const hasTopbarCritical = showReject || showCancel;
  /** Safe area bas système — toujours, avec ou sans footer d’actions. */
  const safeBottom = Math.max(insets.bottom, Spacing.two);
  const footerPad = safeBottom + Spacing.three;
  const footerContentH = ACTION_BTN_H + Spacing.three;
  const estimatedFooterH = hasFooter ? footerContentH + footerPad : 0;
  const footerBlockH =
    hasFooter && footerHeight > 0 ? footerHeight : estimatedFooterH;
  const scrollBottomPad =
    (hasFooter ? footerBlockH : safeBottom) + SCROLL_FOOTER_EXTRA;

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

  const handleAccept = () => {
    confirm({
      title: t('order.acceptConfirmTitle'),
      message: t('order.acceptConfirmBody'),
      confirmLabel: t('orders.accept'),
      onConfirm: async () => {
        await respond({ orderId: order._id, accept: true });
      },
    });
  };

  const handleComplete = () => {
    confirm({
      title: t('order.completeConfirmTitle'),
      message: t('order.completeConfirmBody'),
      confirmLabel: t('orders.complete'),
      onConfirm: async () => {
        await complete({ orderId: order._id });
      },
    });
  };

  const handleRefuseOffPlatform = () => {
    if (!payment) return;
    confirm({
      title: t('order.refuseOffPlatformConfirmTitle'),
      message: t('order.refuseOffPlatformConfirmBody'),
      destructive: true,
      confirmLabel: t('payment.refuseOffPlatform'),
      onConfirm: async () => {
        await refuseOffPlatform({ paymentId: payment._id });
      },
    });
  };

  const handlePay = () => {
    confirm({
      title: t('order.payConfirmTitle'),
      message: t('order.payConfirmBody'),
      confirmLabel: t('payment.pay'),
      onConfirm: () => {
        router.push(`/checkout/${order._id}`);
      },
    });
  };

  const handleReview = () => {
    confirm({
      title: t('order.reviewConfirmTitle'),
      message: t('order.reviewConfirmBody'),
      confirmLabel: t('reviews.leaveReview'),
      onConfirm: () => {
        router.push(`/review/${order._id}`);
      },
    });
  };

  const openDirections = () => {
    if (!hasCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}&travelmode=driving`;
    void Linking.openURL(url);
  };

  const topbarCriticalActions = hasTopbarCritical ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      {showReject ? (
        <TopBarCriticalButton
          icon={Prohibit}
          accessibilityLabel={t('orders.reject')}
          onPress={handleReject}
        />
      ) : null}
      {showCancel ? (
        <TopBarCriticalButton
          icon={X}
          accessibilityLabel={t('orders.cancel')}
          onPress={handleCancel}
        />
      ) : null}
    </View>
  ) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <PageScaffold
        title={t('order.detailTitle')}
        subtitle={
          isClient ? t('order.detailSubtitleClient') : t('order.detailSubtitleProvider')
        }
        showBack
        onBack={goBack}
        rightAction={topbarCriticalActions}
        bottomInset={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
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
            <OrderStatusBadge
              label={t(`orders.${displayStatus}`, { defaultValue: displayStatus })}
              status={displayStatus}
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
              label={t(`payment.${displayPaymentStatus}`, {
                defaultValue: displayPaymentStatus,
              })}
              variant={
                displayPaymentStatus === 'held'
                  ? 'verified'
                  : displayPaymentStatus === 'failed' ||
                      displayPaymentStatus === 'refunded'
                    ? 'danger'
                    : 'accent'
              }
            />
          ) : null}
        </View>

        {service ? (
          <Button
            title={t('order.serviceDetailsButton')}
            variant="outline"
            fullWidth
            onPress={() => setServiceSheetOpen(true)}
            icon={<Briefcase size={18} color={colors.ink} weight="bold" />}
          />
        ) : null}

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
                picker={false}
                readOnly
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                paddingVertical: Spacing.two,
                minHeight: 44,
              }}
            >
              <MapPin size={16} color={colors.orbit} weight="fill" />
              <Text style={[textStyle('caption'), { color: colors.body, flex: 1 }]} numberOfLines={3}>
                {locationDisplay ??
                  t('services.coordsSummary', {
                    lat: order.latitude!.toFixed(5),
                    lng: order.longitude!.toFixed(5),
                  })}
              </Text>
              <Pressable
                onPress={openDirections}
                accessibilityRole="link"
                accessibilityLabel={t('order.openDirections')}
                style={({ pressed }) => [
                  { width: 40, height: 40 },
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: Radius.md,
                    backgroundColor: colors.orbitWash,
                    borderWidth: BorderWidth.default,
                    borderColor: colors.borderStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NavigationArrow size={18} color={colors.orbit} weight="fill" />
                </View>
              </Pressable>
            </View>
          </Section>
        ) : null}

        {photoUrls.length > 0 ? (
          <Section title={t('order.photosSection')}>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: PHOTO_GAP,
              }}
            >
              {photoUrls.map((uri, index) => (
                <Pressable
                  key={`order-photo-${index}`}
                  onPress={() => setZoomUri(uri)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t('order.photosSection')}
                  style={({ pressed }) => [
                    { width: photoSize, height: photoSize },
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View
                    style={{
                      width: photoSize,
                      height: photoSize,
                      borderRadius: Radius.lg,
                      overflow: 'hidden',
                      borderWidth: BorderWidth.default,
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.surfaceStrong,
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: photoSize, height: photoSize }}
                      contentFit="cover"
                      recyclingKey={`order-photo-${order._id}-${index}`}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
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

        {showProviderNote || clientReview ? (
          <Section title={t('reviews.orderNotesTitle')}>
            {providerReview && showProviderNote ? (
              <OrderNoteCard
                label={t('reviews.providerNoteOnOrder')}
                rating={providerReview.rating}
                comment={providerReview.comment}
              />
            ) : null}
            {clientReview ? (
              <OrderNoteCard
                label={t('reviews.clientNoteOnOrder')}
                rating={clientReview.rating}
                comment={clientReview.comment}
              />
            ) : null}
          </Section>
        ) : null}

        {order.isOffPlatformPayment ? (
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.two,
              padding: Spacing.four,
              borderRadius: Radius.lg,
              backgroundColor: colors.warning + '18',
              borderWidth: BorderWidth.default,
              borderColor: colors.warning + '40',
            }}
          >
            <WarningCircle size={18} color={colors.warning} weight="fill" />
            <Text style={[textStyle('micro'), { color: colors.body, flex: 1 }]}>
              {showRefuseOffPlatform
                ? t('payment.offPlatformProviderRefuseHint')
                : t('payment.offPlatformWarning')}
            </Text>
          </View>
        ) : null}

        {isClient && order.status === 'completed' && order.canReview && hasReview ? (
          <Text style={[textStyle('caption'), { color: colors.success, textAlign: 'center' }]}>
            {t('reviews.thanks')}
          </Text>
        ) : null}
      </View>
      </PageScaffold>

      {hasFooter ? (
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - footerHeight) > 1) setFooterHeight(h);
          }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.three,
            paddingBottom: footerPad,
            backgroundColor: colors.surfaceCard,
            borderTopWidth: BorderWidth.default,
            borderTopColor: colors.borderStrong,
          }}
        >
          <SheetActionsFooter>
            {showPay ? (
              <SheetSingleAction>
                <AuthPrimaryButton
                  title={t('payment.pay')}
                  onPress={handlePay}
                  tone="ink"
                  backgroundColor={isDark ? '#FFFFFF' : undefined}
                  textColor={isDark ? BrandColors.ink : undefined}
                  flat
                  fill
                />
              </SheetSingleAction>
            ) : null}

            {showAccept ? (
              <SheetSingleAction>
                <AuthPrimaryButton
                  title={t('orders.accept')}
                  onPress={handleAccept}
                  tone="orbit"
                  flat
                  fill
                />
              </SheetSingleAction>
            ) : null}

            {showComplete ? (
              <SheetSingleAction>
                <AuthPrimaryButton
                  title={t('orders.complete')}
                  onPress={handleComplete}
                  tone="orbit"
                  flat
                  fill
                  icon={<CheckCircle size={18} weight="bold" />}
                />
              </SheetSingleAction>
            ) : null}

            {showRefuseOffPlatform ? (
              <SheetSingleAction>
                <AuthPrimaryButton
                  title={t('payment.refuseOffPlatform')}
                  onPress={handleRefuseOffPlatform}
                  tone="danger"
                  flat
                  fill
                />
              </SheetSingleAction>
            ) : null}

            {showReview ? (
              <SheetSingleAction>
                <Button
                  title={t('reviews.leaveReview')}
                  variant="outline"
                  onPress={handleReview}
                  fullWidth
                />
              </SheetSingleAction>
            ) : null}

            {showRateClient ? (
              <SheetSingleAction>
                <Button
                  title={t('reviews.rateClient')}
                  variant="outline"
                  onPress={() => router.push(`/review/client/${order._id}`)}
                  fullWidth
                />
              </SheetSingleAction>
            ) : null}
          </SheetActionsFooter>
        </View>
      ) : null}

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />

      {service ? (
        <ServiceDetailSheet
          visible={serviceSheetOpen}
          onClose={() => setServiceSheetOpen(false)}
          serviceId={service._id}
          onViewFull={(serviceId) => {
            setServiceSheetOpen(false);
            router.push(`/service/${serviceId}`);
          }}
        />
      ) : null}
    </View>
  );
}

function TopBarCriticalButton({
  icon: IconComponent,
  accessibilityLabel,
  onPress,
}: {
  icon: Icon;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: TOPBAR_ICON_SIZE,
        height: TOPBAR_ICON_SIZE,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: TOPBAR_ICON_SIZE,
          height: TOPBAR_ICON_SIZE,
          borderRadius: Radius.lg,
          backgroundColor: colors.error + '12',
          borderWidth: BorderWidth.default,
          borderColor: colors.error + '30',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconComponent size={20} color={colors.error} weight="bold" />
      </View>
    </Pressable>
  );
}

/** Note portée par la commande (client→prestataire ou prestataire→client). */
function OrderNoteCard({
  label,
  rating,
  comment,
}: {
  label: string;
  rating: number;
  comment?: string | null;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        padding: Spacing.four,
        borderRadius: Radius.lg,
        backgroundColor: colors.surfaceStrong,
        borderWidth: BorderWidth.default,
        borderColor: colors.border,
        gap: Spacing.two,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamily('body', 'medium'),
          fontSize: 14,
          color: colors.ink,
        }}
      >
        {label}
      </Text>
      <StarRating rating={rating} size={18} />
      {comment ? (
        <Text style={[textStyle('caption'), { color: colors.body, lineHeight: 20 }]}>
          {comment}
        </Text>
      ) : null}
    </View>
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
