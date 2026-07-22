import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SealCheck, Crown, MapPin, Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/providers/ThemeProvider';
import { CategoryPlaceholder } from '@/components/ui/CategoryPlaceholder';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { SatelliteButton } from '@/components/ui/SatelliteButton';
import { formatPrice, formatRating } from '@/types';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const PORTRAIT_SIZE = 220;

interface ServiceCardProps {
  title: string;
  description: string;
  price?: number;
  pricingType: 'fixed' | 'negotiable';
  photo?: string;
  rating: number;
  reviewCount: number;
  providerName: string;
  city: string;
  isVerified?: boolean;
  isPremium?: boolean;
  categoryIcon?: string;
  categoryLabel?: string;
  onPress: () => void;
}

export function ServiceCard({
  title,
  description,
  price,
  pricingType,
  photo,
  rating,
  reviewCount,
  providerName,
  city,
  isVerified,
  isPremium,
  categoryLabel,
  onPress,
}: ServiceCardProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const ratingColor = colors.rating ?? colors.accentSoft;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginBottom: Spacing.twelve,
        alignItems: 'center',
        opacity: pressed ? 0.94 : 1,
      })}
    >
      <View style={{ width: PORTRAIT_SIZE, marginBottom: Spacing.four }}>
        <View
          style={{
            width: PORTRAIT_SIZE,
            height: PORTRAIT_SIZE,
            borderRadius: PORTRAIT_SIZE / 2,
            backgroundColor: colors.surfaceStrong,
            overflow: 'hidden',
            ...Shadows.elevated,
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
              <CategoryPlaceholder size={48} />
            </View>
          )}
        </View>

        <View
          style={{
            position: 'absolute',
            right: -4,
            bottom: 8,
          }}
        >
          <SatelliteButton onPress={onPress} size={52} />
        </View>

        {isPremium ? (
          <View
            style={{
              position: 'absolute',
              top: Spacing.four,
              left: Spacing.four,
              backgroundColor: colors.accent,
              borderRadius: Radius.pill,
              paddingHorizontal: Spacing.three,
              paddingVertical: Spacing.one,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={12} color={colors.onAccent} weight="fill" />
            <Text style={[textStyle('micro'), { color: colors.onAccent }]}>{t('common.premium')}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ width: '100%', paddingHorizontal: Spacing.two }}>
        <Eyebrow label={categoryLabel ?? t('common.services', { defaultValue: 'Services' })} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.two }}>
          <Text numberOfLines={2} style={[textStyle('cardHeading'), { color: colors.ink, flex: 1 }]}>
            {title}
          </Text>
          {isVerified ? <SealCheck size={20} color={colors.accentSoft} weight="fill" /> : null}
        </View>

        <Text numberOfLines={2} style={[textStyle('caption'), { color: colors.muted, marginBottom: Spacing.three }]}>
          {description}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <MapPin size={14} color={colors.muted} />
            <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted, flex: 1 }]}>
              {providerName} · {city}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={12} color={ratingColor} weight="fill" />
              <Text style={[textStyle('micro'), { color: colors.ink }]}>{formatRating(rating)}</Text>
              {reviewCount > 0 ? (
                <Text style={[textStyle('micro'), { color: colors.slate }]}>({reviewCount})</Text>
              ) : null}
            </View>
            <Text style={[textStyle('body'), { color: colors.ink, fontFamily: 'SofiaSans_500Medium' }]}>
              {pricingType === 'negotiable'
                ? t('common.negotiable')
                : price
                  ? formatPrice(price)
                  : t('common.from')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
