import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SealCheck, Crown, MapPin, Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/providers/ThemeProvider';
import { CategoryIcon } from '@/lib/categoryIcons';
import { Text } from '@/components/ui/ThemedText';
import { formatPrice, formatRating } from '@/types';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

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
}

/**
 * Card service — image 16:9, badges overlay, note + prix,
 * ligne prestataire (avatar + nom + ville) + prix. Remplit la largeur du parent.
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
}: ServiceCardProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const ratingColor = colors.rating ?? colors.accentSoft;
  const providerInitial = (providerName || 'T').charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        backgroundColor: colors.surfaceCard,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        overflow: 'hidden',
        opacity: pressed ? 0.96 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
        ...Shadows.nav,
      })}
    >
      {/* Image 16:9 + overlays */}
      <View
        style={{
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: colors.surfaceStrong,
          borderTopLeftRadius: Radius.lg,
          borderTopRightRadius: Radius.lg,
          overflow: 'hidden',
        }}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={{
              width: '100%',
              height: '100%',
              borderTopLeftRadius: Radius.lg,
              borderTopRightRadius: Radius.lg,
            }}
            contentFit="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <CategoryIcon icon={categoryIcon} size={44} color={colors.muted} weight="regular" />
          </View>
        )}

        {/* Badge catégorie — overlay haut-gauche */}
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
              ...Shadows.nav,
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

        {/* Badge premium — overlay haut-droite */}
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

        {/* Note — overlay bas-droite */}
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

      {/* Contenu */}
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
            height: 1,
            backgroundColor: colors.border,
            marginVertical: Spacing.three,
          }}
        />

        {/* Pied : prestataire + prix */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                <Text style={[textStyle('micro'), { color: colors.onPrimary }]}>{providerInitial}</Text>
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
            <Text style={[textStyle('micro'), { color: colors.muted }]}>
              {t('common.from')}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 16,
                color: colors.ink,
              }}
            >
              {pricingType === 'negotiable'
                ? t('common.negotiable')
                : price
                  ? formatPrice(price)
                  : '—'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
