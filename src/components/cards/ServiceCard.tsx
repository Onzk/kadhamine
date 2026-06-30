import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Star, BadgeCheck, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { CategoryPlaceholder } from '@/components/ui/CategoryPlaceholder';
import { formatPrice, formatRating } from '@/types';

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
  categoryIcon,
  onPress,
}: ServiceCardProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card onPress={onPress} padded={false} style={{ marginBottom: 12 }}>
      <View style={{ height: 140, backgroundColor: colors.canvasSoft }}>
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
              top: 8,
              right: 8,
              backgroundColor: colors.accent,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={12} color={colors.onAccent} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.onAccent }}>
              {t('common.premium')}
            </Text>
          </View>
        )}
      </View>

      <View style={{ padding: 14 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 4 }}
        >
          {title}
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 13, color: colors.body, marginBottom: 10 }}>
          {description}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Star size={14} color={colors.accent} fill={colors.accent} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }}>
                {formatRating(rating)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>({reviewCount})</Text>
            </View>
            {isVerified && <BadgeCheck size={14} color={colors.primary} />}
          </View>

          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
            {pricingType === 'negotiable'
              ? t('common.negotiable')
              : price
                ? formatPrice(price)
                : t('common.from')}
          </Text>
        </View>

        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>
          {providerName} · {city}
        </Text>
      </View>
    </Card>
  );
}
