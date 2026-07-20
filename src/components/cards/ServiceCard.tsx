import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Star, SealCheck, Crown, MapPin } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { CategoryPlaceholder } from '@/components/ui/CategoryPlaceholder';
import { formatPrice, formatRating } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

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
  onPress,
}: ServiceCardProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const ratingColor = colors.rating ?? colors.accentSoft;

  return (
    <Card onPress={onPress} padded={false} variant="stone" style={{ marginBottom: Spacing.three }}>
      <View
        style={{
          height: 160,
          backgroundColor: colors.surfaceStrong,
          borderTopLeftRadius: Radius.xl,
          borderTopRightRadius: Radius.xl,
          overflow: 'hidden',
        }}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <CategoryPlaceholder size={40} />
          </View>
        )}

        {/* Badge note overlay — pattern design.png */}
        <View
          style={{
            position: 'absolute',
            top: Spacing.twoHalf,
            right: Spacing.twoHalf,
            backgroundColor: colors.canvas,
            borderRadius: Radius.pill,
            paddingHorizontal: Spacing.twoHalf,
            paddingVertical: Spacing.one,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Star size={12} color={ratingColor} weight="fill" />
          <Text style={[textStyle('micro'), { color: colors.ink, fontWeight: '700' }]}>
            {formatRating(rating)}
          </Text>
        </View>

        {isPremium && (
          <View
            style={{
              position: 'absolute',
              top: Spacing.twoHalf,
              left: Spacing.twoHalf,
              backgroundColor: colors.accent,
              borderRadius: Radius.pill,
              paddingHorizontal: Spacing.twoHalf,
              paddingVertical: Spacing.one,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={12} color={colors.onAccent} weight="fill" />
            <Text style={[textStyle('micro'), { color: colors.onAccent }]}>{t('common.premium')}</Text>
          </View>
        )}
      </View>

      <View style={{ padding: Spacing.four }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.one }}>
          <Text numberOfLines={1} style={[textStyle('featureHeading'), { color: colors.ink, flex: 1 }]}>
            {title}
          </Text>
          {isVerified ? <SealCheck size={18} color={colors.accentSoft} weight="fill" /> : null}
        </View>

        <Text numberOfLines={2} style={[textStyle('caption'), { color: colors.muted, marginBottom: Spacing.twoHalf }]}>
          {description}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} color={colors.muted} />
            <Text style={[textStyle('micro'), { color: colors.muted }]}>
              {providerName} · {city}
            </Text>
          </View>

          <Text style={[textStyle('body'), { color: colors.primary, fontWeight: '700' }]}>
            {pricingType === 'negotiable'
              ? t('common.negotiable')
              : price
                ? formatPrice(price)
                : t('common.from')}
          </Text>
        </View>

        {reviewCount > 0 ? (
          <Text style={[textStyle('micro'), { color: colors.slate, marginTop: Spacing.one }]}>
            {reviewCount} avis
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
