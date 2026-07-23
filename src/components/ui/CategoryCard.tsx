import { getCategoryVisual } from '@/lib/categoryTheme';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const CARD_RADIUS = Radius.lg;
const CARD_MIN_HEIGHT = 148;

export interface CategoryCardData {
  id: string;
  label: string;
  icon?: string;
  slug?: string;
  serviceCount?: number;
}

function parseRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Mélange un hex avec du blanc pour adoucir le fond pastel (jour). */
function softenPastel(hex: string, whiteMix = 0.62): string {
  const [r, g, b] = parseRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * whiteMix);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Assombrit un pastel pour le mode nuit (mélange noir). */
function darkenPastel(hex: string, blackMix = 0.72): string {
  const [r, g, b] = parseRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - blackMix));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

interface CategoryCardProps {
  item: CategoryCardData;
  width: number;
  /** Fixed height — defaults to CARD_MIN_HEIGHT. */
  height?: number;
  onPress: () => void;
}

/** Card catégorie accueil — pastel adouci + bordure visible (token). */
export function CategoryCard({ item, width, height = CARD_MIN_HEIGHT, onPress }: CategoryCardProps) {
  const { colors, isDark } = useAppTheme();
  const { Icon, pastel } = getCategoryVisual({
    icon: item.icon,
    slug: item.slug,
    label: item.label,
  });
  const isEmpty = item.serviceCount === 0;
  const cardBg = isDark ? darkenPastel(pastel.bg, .9) : softenPastel(pastel.bg, 0.58);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height,
        opacity: pressed ? 0.9 : isEmpty ? 0.6 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: CARD_RADIUS,
          backgroundColor: cardBg,
          borderWidth: 0.1,
          borderColor: colors.borderStrong,
          padding: Spacing.three,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pastel.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={pastel.fg} weight="bold" />
        </View>

        <View>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 13,
              lineHeight: 17,
              color: colors.ink,
              marginBottom: Spacing.one,
            }}
          >
            {item.label}
          </Text>

          {item.serviceCount !== undefined ? (
            <Text style={[textStyle('micro'), { color: colors.muted }]}>
              {item.serviceCount} service{item.serviceCount !== 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

interface CategoryCardSkeletonProps {
  width: number;
  height?: number;
}

export function CategoryCardSkeleton({ width, height = CARD_MIN_HEIGHT }: CategoryCardSkeletonProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        width,
        height,
        borderRadius: CARD_RADIUS,
        backgroundColor: colors.surfaceCard,
        borderWidth: 0.1,
        borderColor: colors.borderStrong,
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
