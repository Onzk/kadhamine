import { Enter } from '@/components/ui/Enter';
import { Text } from '@/components/ui/ThemedText';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { formatPrice, formatRating } from '@/types';
import { Image } from 'expo-image';
import { CaretRight, Crown, MapPin, SealCheck, Star } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

const LIST_THUMB = 80;

interface ServiceCardProps {
  title: string;
  description: string;
  price?: number;
  pricingType: 'fixed' | 'negotiable';
  photo?: string;
  rating: number;
  reviewCount: number;
  providerName: string;
  providerAvatar?: string;
  city: string;
  isVerified?: boolean;
  isPremium?: boolean;
  categoryIcon?: string;
  categoryLabel?: string;
  onPress: () => void;
  /**
   * `card` (défaut) — image au-dessus, contenu en dessous.
   * `list` — image et infos côte à côte (rangée compacte).
   */
  layout?: 'card' | 'list';
  /** Chevron à droite (tooltip carte / incitation au clic). */
  showChevron?: boolean;
  /** Index for staggered enter animation. */
  enterIndex?: number;
}

/**
 * Card service — variante card (16:9) ou list (horizontal).
 */
export function ServiceCard({
  title,
  description,
  price,
  pricingType,
  photo,
  rating,
  reviewCount,
  providerName,
  providerAvatar,
  city,
  isVerified,
  isPremium,
  categoryIcon,
  categoryLabel,
  onPress,
  layout = 'card',
  showChevron = false,
  enterIndex = 0,
}: ServiceCardProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const ratingColor = colors.rating ?? colors.accentSoft;
  const providerInitial = (providerName || 'T').charAt(0).toUpperCase();
  const priceLabel =
    pricingType === 'negotiable'
      ? t('common.negotiable')
      : price
        ? formatPrice(price)
        : '—';

  if (layout === 'list') {
    return (
      <Enter variant="card" index={enterIndex} style={{ width: '100%' }}>
      <Pressable onPress={onPress} style={{ width: '100%' }}>
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.three,
              padding: Spacing.three,
              borderRadius: Radius.lg,
              borderWidth: 0.1,
              borderColor: colors.borderStrong,
              backgroundColor: colors.surfaceCard,
              opacity: pressed ? 0.96 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            }}
          >
            <View
              style={{
                width: LIST_THUMB,
                height: LIST_THUMB,
                borderRadius: Radius.sm,
                overflow: 'hidden',
                backgroundColor: colors.surfaceStrong,
              }}
            >
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon icon={categoryIcon} size={24} color={colors.muted} weight="regular" />
                </View>
              )}
            </View>

            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                gap: Spacing.one,
                minHeight: LIST_THUMB,
                paddingVertical: 2,
              }}
            >
              <View>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 14,
                    lineHeight: 18,
                    letterSpacing: -0.2,
                    color: colors.ink,
                  }}
                >
                  {title}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.two,
                    marginTop: Spacing.one,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      overflow: 'hidden',
                      backgroundColor: colors.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {providerAvatar ? (
                      <Image
                        source={{ uri: providerAvatar }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={[textStyle('micro'), { color: colors.onPrimary, fontSize: 10 }]}>
                        {providerInitial}
                      </Text>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[textStyle('micro'), { color: colors.muted, flexShrink: 1 }]}
                  >
                    {providerName}
                  </Text>
                  {isVerified ? <SealCheck size={12} color={colors.info} weight="fill" /> : null}
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: Spacing.two,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}>
                  {reviewCount > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Star size={11} color={ratingColor} weight="fill" />
                      <Text style={[textStyle('micro'), { color: colors.ink }]}>
                        {formatRating(rating)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 }}>
                    <MapPin size={11} color={colors.muted} />
                    <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted }]}>
                      {city}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 13,
                    color: colors.ink,
                  }}
                >
                  {priceLabel}
                </Text>
              </View>
            </View>

            {showChevron ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CaretRight size={16} color={colors.ink} weight="bold" />
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
      </Enter>
    );
  }

  return (
    <Enter variant="card" index={enterIndex} style={{ width: '100%' }}>
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: Radius.lg,
            borderWidth: 0.1,
            borderColor: colors.borderStrong,
            overflow: 'hidden',
            backgroundColor: colors.surfaceCard,
            opacity: pressed ? 0.96 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          }}
        >
          {/* Image 16:9 + overlays */}
          <View
            style={{
              width: '100%',
              aspectRatio: 16 / 9,
              backgroundColor: colors.surfaceStrong,
              overflow: 'hidden',
            }}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CategoryIcon icon={categoryIcon} size={44} color={colors.muted} weight="regular" />
              </View>
            )}

            {categoryLabel ? (
              <View
                style={{
                  position: 'absolute',
                  top: Spacing.three,
                  left: Spacing.three,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.pill,
                  paddingLeft: Spacing.two,
                  paddingRight: Spacing.three,
                  paddingVertical: 5,
                }}
              >
                <CategoryIcon icon={categoryIcon} size={13} color={colors.orbit} weight="bold" />
                <Text
                  numberOfLines={1}
                  style={[textStyle('monoLabel'), { color: colors.ink, maxWidth: 130 }]}
                >
                  {categoryLabel}
                </Text>
              </View>
            ) : null}

            {isPremium ? (
              <View
                style={{
                  position: 'absolute',
                  top: Spacing.three,
                  right: Spacing.three,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.accent,
                  borderRadius: Radius.pill,
                  paddingHorizontal: Spacing.two,
                  paddingVertical: 5,
                }}
              >
                <Crown size={12} color={colors.onAccent} weight="fill" />
                <Text style={[textStyle('monoLabel'), { color: colors.onAccent }]}>
                  {t('common.premium')}
                </Text>
              </View>
            ) : null}

            {reviewCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: Spacing.three,
                  right: Spacing.three,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.ink,
                  borderRadius: Radius.pill,
                  paddingHorizontal: Spacing.two,
                  paddingVertical: 5,
                }}
              >
                <Star size={12} color={ratingColor} weight="fill" />
                <Text style={[textStyle('monoLabel'), { color: colors.onPrimary }]}>
                  {formatRating(rating)}
                </Text>
                <Text style={[textStyle('monoLabel'), { color: colors.dust }]}>({reviewCount})</Text>
              </View>
            ) : null}
          </View>

          <View style={{ padding: Spacing.four }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 17,
                lineHeight: 22,
                letterSpacing: -0.3,
                color: colors.ink,
              }}
            >
              {title}
            </Text>

            <Text
              numberOfLines={2}
              style={[textStyle('caption'), { color: colors.muted, marginTop: Spacing.one }]}
            >
              {description}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: Spacing.three,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    overflow: 'hidden',
                    backgroundColor: colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {providerAvatar ? (
                    <Image
                      source={{ uri: providerAvatar }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={[textStyle('micro'), { color: colors.onPrimary }]}>
                      {providerInitial}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 13,
                        color: colors.ink,
                        flexShrink: 1,
                      }}
                    >
                      {providerName}
                    </Text>
                    {isVerified ? <SealCheck size={13} color={colors.info} weight="fill" /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} color={colors.muted} />
                    <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted }]}>
                      {city}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', marginLeft: Spacing.two }}>
                <Text style={[textStyle('micro'), { color: colors.muted }]}>{t('common.from')}</Text>
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 16,
                    color: colors.ink,
                  }}
                >
                  {priceLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Pressable>
    </Enter>
  );
}
