import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { getCategoryVisual } from '@/lib/categoryTheme';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

const CARD_RADIUS = Radius.lg;
const CARD_MIN_HEIGHT = 148;

export interface CategoryCardData {
  id: string;
  label: string;
  icon?: string;
  slug?: string;
  serviceCount?: number;
}

/** Mélange un hex avec du blanc pour adoucir le fond pastel. */
function softenPastel(hex: string, whiteMix = 0.62): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * whiteMix);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Bordure légère teintée depuis la couleur d’accent. */
function softBorder(hex: string, alpha = 0.22): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface CategoryCardProps {
  item: CategoryCardData;
  width: number;
  onPress: () => void;
}

/** Card catégorie accueil — pastel adouci + bordure légère. */
export function CategoryCard({ item, width, onPress }: CategoryCardProps) {
  const { colors } = useAppTheme();
  const { Icon, pastel } = getCategoryVisual({
    icon: item.icon,
    slug: item.slug,
    label: item.label,
  });
  const isEmpty = item.serviceCount === 0;
  const cardBg = softenPastel(pastel.bg, 0.58);
  const borderColor = softBorder(pastel.fg, 0.2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        minHeight: CARD_MIN_HEIGHT,
        borderRadius: CARD_RADIUS,
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor,
        padding: Spacing.three,
        opacity: pressed ? 0.9 : isEmpty ? 0.6 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
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
        borderWidth: 1,
        borderColor: colors.border,
        padding: Spacing.three,
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
