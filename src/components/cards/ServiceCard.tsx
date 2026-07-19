import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Star, BadgeCheck, Crown } from 'lucide-react-native';
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

  return (
    <Card onPress={onPress} padded={false} variant="stone" style={{ marginBottom: Spacing.three }}>
      <View
        style={{
          height: 140,
          backgroundColor: colors.canvasSoft,
          borderTopLeftRadius: Radius.lg,
          borderTopRightRadius: Radius.lg,
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
        {isPremium && (
          <View
            style={{
              position: 'absolute',
              top: Spacing.two,
              right: Spacing.two,
              backgroundColor: colors.accent,
              borderRadius: Radius.sm,
              paddingHorizontal: Spacing.two,
              paddingVertical: Spacing.one,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.one,
            }}
          >
            <Crown size={12} color={colors.onAccent} />
            <Text style={[textStyle('micro'), { color: colors.onAccent }]}>{t('common.premium')}</Text>
          </View>
        )}
      </View>

      <View style={{ padding: Spacing.four }}>
        <Text numberOfLines={1} style={[textStyle('featureHeading'), { color: colors.ink, marginBottom: Spacing.one }]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={[textStyle('caption'), { color: colors.body, marginBottom: Spacing.twoHalf }]}>
          {description}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.oneHalf }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Star size={14} color={colors.accent} fill={colors.accent} />
              <Text style={[textStyle('caption'), { color: colors.ink }]}>{formatRating(rating)}</Text>
              <Text style={[textStyle('micro'), { color: colors.muted }]}>({reviewCount})</Text>
            </View>
            {isVerified && <BadgeCheck size={14} color={colors.link} />}
          </View>

          <Text style={[textStyle('body'), { color: colors.ink }]}>
            {pricingType === 'negotiable'
              ? t('common.negotiable')
              : price
                ? formatPrice(price)
                : t('common.from')}
          </Text>
        </View>

        <Text style={[textStyle('micro'), { color: colors.muted, marginTop: Spacing.oneHalf }]}>
          {providerName} · {city}
        </Text>
      </View>
    </Card>
  );
}
