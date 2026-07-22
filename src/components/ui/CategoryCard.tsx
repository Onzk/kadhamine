import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { CategoryIcon } from '@/lib/categoryIcons';
import { getCategoryPastel } from '@/lib/categoryTheme';
import { fontFamily, textStyle } from '@/theme/typography';
import { Shadows, Spacing } from '@/theme/tokens';

const CARD_RADIUS = 16;

export interface CategoryCardData {
  id: string;
  label: string;
  icon?: string;
  serviceCount?: number;
}

interface CategoryCardProps {
  item: CategoryCardData;
  width: number;
  onPress: () => void;
}

/** Card catégorie 2 colonnes — icône pastel, nom, compteur services optionnel. */
export function CategoryCard({ item, width, onPress }: CategoryCardProps) {
  const { colors } = useAppTheme();
  const pastel = getCategoryPastel(item.icon);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        borderRadius: CARD_RADIUS,
        backgroundColor: colors.surfaceCard,
        padding: Spacing.four,
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...Shadows.nav,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: pastel.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.three,
        }}
      >
        <CategoryIcon icon={item.icon} size={24} color={pastel.fg} weight="bold" />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontFamily: fontFamily('body', 'medium'),
          fontSize: 15,
          lineHeight: 20,
          color: colors.ink,
          marginBottom: item.serviceCount !== undefined ? Spacing.one : 0,
        }}
      >
        {item.label}
      </Text>

      {item.serviceCount !== undefined ? (
        <Text style={[textStyle('micro'), { color: colors.muted }]}>
          {item.serviceCount} service{item.serviceCount !== 1 ? 's' : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}

interface CategoryCardSkeletonProps {
  width: number;
}

export function CategoryCardSkeleton({ width }: CategoryCardSkeletonProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        width,
        borderRadius: CARD_RADIUS,
        backgroundColor: colors.surfaceCard,
        padding: Spacing.four,
        ...Shadows.nav,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.surfaceStrong,
          marginBottom: Spacing.three,
        }}
      />
      <View
        style={{
          height: 14,
          width: '80%',
          borderRadius: 8,
          backgroundColor: colors.surfaceStrong,
          marginBottom: 8,
        }}
      />
      <View style={{ height: 10, width: '50%', borderRadius: 6, backgroundColor: colors.surfaceStrong }} />
    </View>
  );
}
