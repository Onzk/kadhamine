import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SealCheck, Star, MapPin } from 'phosphor-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { CategoryIcon } from '@/lib/categoryIcons';
import { formatDistance } from '@/utils/geo';
import { formatRating } from '@/types';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export interface MapTalentItem {
  serviceId: string;
  title: string;
  providerName: string;
  avatarUrl?: string;
  categoryId?: string;
  categoryIcon?: string;
  categoryLabel?: string;
  rating: number;
  reviewCount?: number;
  distanceKm?: number;
  isVerified?: boolean;
  isPremium?: boolean;
}

interface MapTalentRowProps {
  item: MapTalentItem;
  selected?: boolean;
  onPress: () => void;
}

/** Card compacte pour le bottom sheet carte. */
export function MapTalentRow({ item, selected, onPress }: MapTalentRowProps) {
  const { colors } = useAppTheme();
  const ratingColor = colors.rating ?? colors.accentSoft;
  const initial = (item.providerName || 'T').charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.four,
        backgroundColor: selected ? colors.surfaceStrong : colors.surfaceCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          overflow: 'hidden',
          backgroundColor: colors.iconWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <CategoryIcon icon={item.categoryIcon} size={22} color={colors.orbit} weight="bold" />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fontFamily('body', 'medium'),
            fontSize: 15,
            color: colors.ink,
          }}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted, flexShrink: 1 }]}>
            {item.providerName}
          </Text>
          {item.isVerified ? <SealCheck size={12} color={colors.info} weight="fill" /> : null}
          {item.categoryLabel ? (
            <Text style={[textStyle('micro'), { color: colors.slate }]}>· {item.categoryLabel}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: 4 }}>
          {item.rating > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={12} color={ratingColor} weight="fill" />
              <Text style={[textStyle('micro'), { color: colors.ink }]}>{formatRating(item.rating)}</Text>
            </View>
          ) : null}
          {item.distanceKm !== undefined ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MapPin size={12} color={colors.muted} />
              <Text style={[textStyle('micro'), { color: colors.muted }]}>
                {formatDistance(item.distanceKm)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
