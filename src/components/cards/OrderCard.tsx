import React from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  CalendarBlank,
  WarningCircle,
} from 'phosphor-react-native';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { formatPrice } from '@/types';

const AVATAR = 40;

const STATUS_COLORS: Record<string, 'default' | 'verified' | 'premium' | 'danger' | 'accent'> = {
  pending: 'accent',
  accepted: 'verified',
  completed: 'default',
  cancelled: 'danger',
};

const PAYMENT_BADGE: Record<string, 'default' | 'verified' | 'premium' | 'danger' | 'accent'> = {
  pending: 'accent',
  held: 'verified',
  released: 'default',
  refunded: 'danger',
  failed: 'danger',
};

function formatShortDate(ts: number | string, locale: string) {
  try {
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    return date.toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(ts);
  }
}

export type OrderCardProps = {
  title: string;
  status: string;
  agreedPrice?: number | null;
  description?: string | null;
  counterpartyName?: string | null;
  counterpartyAvatar?: string | null;
  counterpartyLabel: string;
  createdAt: number;
  deliveryDate?: string | null;
  paymentStatus?: string | null;
  isOffPlatform?: boolean;
  /** Footer actions (buttons). */
  actions?: React.ReactNode;
  onPress?: () => void;
};

/**
 * Carte commande — qualité list ServiceCard : padding, badges, prix, parties, dates.
 */
export function OrderCard({
  title,
  status,
  agreedPrice,
  description,
  counterpartyName,
  counterpartyAvatar,
  counterpartyLabel,
  createdAt,
  deliveryDate,
  paymentStatus,
  isOffPlatform,
  actions,
  onPress,
}: OrderCardProps) {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const initial = (counterpartyName || 'T').charAt(0).toUpperCase();

  const body = (
    <>
      {/* Header: title + status */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: Spacing.three,
        }}
      >
        <View style={{ flex: 1, gap: Spacing.one }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 16,
              lineHeight: 22,
              letterSpacing: -0.2,
              color: colors.ink,
            }}
          >
            {title}
          </Text>
          {description ? (
            <Text numberOfLines={2} style={[textStyle('caption'), { color: colors.muted }]}>
              {description}
            </Text>
          ) : null}
        </View>
        <Badge
          label={t(`orders.${status}`, { defaultValue: status })}
          variant={STATUS_COLORS[status] ?? 'default'}
        />
      </View>

      {/* Party + price row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: Spacing.three,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}>
          <View
            style={{
              width: AVATAR,
              height: AVATAR,
              borderRadius: AVATAR / 2,
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
              <Text
                style={[
                  textStyle('micro'),
                  { color: colors.ink, fontFamily: fontFamily('body', 'medium') },
                ]}
              >
                {initial}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[textStyle('micro'), { color: colors.muted }]}>{counterpartyLabel}</Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 14,
                color: colors.ink,
              }}
            >
              {counterpartyName || t('profile.defaultName')}
            </Text>
          </View>
        </View>

        {agreedPrice != null ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[textStyle('micro'), { color: colors.muted }]}>{t('payment.amount')}</Text>
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 16,
                color: colors.ink,
              }}
            >
              {formatPrice(agreedPrice)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Meta: dates + payment */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: Spacing.two,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: Spacing.two,
            paddingVertical: 4,
            borderRadius: Radius.pill,
            backgroundColor: colors.iconWash,
          }}
        >
          <CalendarBlank size={12} color={colors.muted} />
          <Text style={[textStyle('micro'), { color: colors.muted }]}>
            {formatShortDate(createdAt, i18n.language)}
          </Text>
        </View>

        {deliveryDate ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: Spacing.two,
              paddingVertical: 4,
              borderRadius: Radius.pill,
              backgroundColor: colors.iconWash,
            }}
          >
            <Briefcase size={12} color={colors.muted} />
            <Text style={[textStyle('micro'), { color: colors.muted }]}>
              {t('orders.delivery')}: {formatShortDate(deliveryDate, i18n.language)}
            </Text>
          </View>
        ) : null}

        {paymentStatus ? (
          <Badge
            label={t(`payment.${paymentStatus}`, { defaultValue: paymentStatus })}
            variant={PAYMENT_BADGE[paymentStatus] ?? 'default'}
          />
        ) : null}
      </View>

      {isOffPlatform ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: Spacing.two,
            padding: Spacing.three,
            borderRadius: Radius.sm,
            backgroundColor: colors.error + '12',
            borderWidth: BorderWidth.default,
            borderColor: colors.error + '30',
          }}
        >
          <View style={{ marginTop: 1 }}>
            <WarningCircle size={16} color={colors.error} weight="fill" />
          </View>
          <Text style={[textStyle('micro'), { color: colors.error, flex: 1 }]}>
            {t('payment.offPlatformWarning')}
          </Text>
        </View>
      ) : null}

      {actions ? <View style={{ gap: Spacing.two }}>{actions}</View> : null}
    </>
  );

  const chrome = (pressed: boolean) => (
    <View
      style={{
        borderRadius: Radius.lg,
        borderWidth: BorderWidth.default,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surfaceCard,
        padding: Spacing.four,
        gap: Spacing.three,
        opacity: pressed ? 0.96 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      }}
    >
      {body}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ width: '100%' }}>
        {({ pressed }) => chrome(pressed)}
      </Pressable>
    );
  }

  return chrome(false);
}

/** Skeleton list row matching OrderCard chrome. */
export function OrderCardSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        borderRadius: Radius.lg,
        borderWidth: BorderWidth.default,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surfaceCard,
        padding: Spacing.four,
        gap: Spacing.three,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three }}>
        <View style={{ flex: 1, gap: Spacing.two }}>
          <View style={{ height: 18, width: '70%', borderRadius: Radius.sm, backgroundColor: colors.surfaceStrong }} />
          <View style={{ height: 12, width: '90%', borderRadius: Radius.sm, backgroundColor: colors.surfaceStrong }} />
        </View>
        <View style={{ height: 24, width: 72, borderRadius: Radius.pill, backgroundColor: colors.surfaceStrong }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <View style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: colors.surfaceStrong }} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ height: 10, width: 48, borderRadius: Radius.sm, backgroundColor: colors.surfaceStrong }} />
          <View style={{ height: 14, width: 100, borderRadius: Radius.sm, backgroundColor: colors.surfaceStrong }} />
        </View>
        <View style={{ height: 28, width: 64, borderRadius: Radius.sm, backgroundColor: colors.surfaceStrong }} />
      </View>
    </View>
  );
}
