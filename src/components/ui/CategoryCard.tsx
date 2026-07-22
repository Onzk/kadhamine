import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { getCategoryVisual } from '@/lib/categoryTheme';
import { fontFamily, textStyle } from '@/theme/typography';
import { Shadows, Spacing } from '@/theme/tokens';

const CARD_RADIUS = 16;
const CARD_MIN_HEIGHT = 148;

export interface CategoryCardData {
  id: string;
  label: string;
  icon?: string;
  slug?: string;
  serviceCount?: number;
}

interface CategoryCardProps {
  item: CategoryCardData;
  width: number;
  onPress: () => void;
}

/** Card catégorie — icône pastel métier, nom, compteur ; opacité réduite si 0 services. */
export function CategoryCard({ item, width, onPress }: CategoryCardProps) {
  const { colors } = useAppTheme();
  const { Icon, pastel } = getCategoryVisual({
    icon: item.icon,
    slug: item.slug,
    label: item.label,
  });
  const isEmpty = item.serviceCount === 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        minHeight: CARD_MIN_HEIGHT,
        borderRadius: CARD_RADIUS,
        backgroundColor: colors.surfaceCard,
        padding: Spacing.three,
        opacity: pressed ? 0.9 : isEmpty ? 0.6 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        ...Shadows.nav,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: pastel.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.two,
        }}
      >
        <Icon size={22} color={pastel.fg} weight="bold" />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontFamily: fontFamily('body', 'medium'),
          fontSize: 13,
          lineHeight: 17,
          color: colors.ink,
          marginBottom: Spacing.one,
          minHeight: 34,
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
        minHeight: CARD_MIN_HEIGHT,
        borderRadius: CARD_RADIUS,
        backgroundColor: colors.surfaceCard,
        padding: Spacing.three,
        ...Shadows.nav,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surfaceStrong,
          marginBottom: Spacing.two,
        }}
      />
      <View
        style={{
          height: 12,
          width: '90%',
          borderRadius: 6,
          backgroundColor: colors.surfaceStrong,
          marginBottom: 8,
        }}
      />
      <View style={{ height: 10, width: '45%', borderRadius: 5, backgroundColor: colors.surfaceStrong }} />
    </View>
  );
}
