import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Crown, MapPin, CheckCircle, Briefcase } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { Text } from '@/components/ui/ThemedText';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { formatRating } from '@/types';

import {
  categoryLabel,
  distinctionLabel,
  isProviderPremium,
  type HomeProviderItem,
} from '@/components/cards/providerShared';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP = Spacing.three;
const ROW_GAP = Spacing.three;
/** Largeur tuile en grille verticale. */
const TILE_W = (SCREEN_W - PAGE_H_PAD * 2 - COL_GAP) / 2;
const LIST_TILE_H = 132;
const LIST_TILE_W = SCREEN_W - PAGE_H_PAD * 2;

/** Masonry horizontal — 3 rangées (~count/3), hauteurs décalées. */
const ROW_COUNT = 3;
const ROW_HEIGHTS = [188, 168, 152] as const;
const TRACK_HEIGHT =
  ROW_HEIGHTS.reduce((sum, h) => sum + h, 0) + ROW_GAP * (ROW_COUNT - 1);

interface ProviderGridProps {
  items: HomeProviderItem[] | undefined;
  onPressProvider: (profileId: Id<'profiles'>) => void;
  showHeader?: boolean;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** `horizontal` (défaut) — scroll latéral 3 rangées. `grid` — 2 colonnes. `list` — liste verticale. */
  layout?: 'horizontal' | 'grid' | 'list';
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function pickHorizontalWidth(item: HomeProviderItem): number {
  const h = hashId(item.profile._id) % 3;
  if (item.profile.isPremium) return h === 0 ? 180 : 164;
  return h === 0 ? 156 : 140;
}

type SizedTile = {
  item: HomeProviderItem;
  width: number;
  height: number;
  tall: boolean;
};

/** Répartit les tuiles sur 3 rangées en respectant l’ordre (premium / notes d’abord). */
function buildHorizontalRows(items: HomeProviderItem[]): SizedTile[][] {
  const rows: SizedTile[][] = Array.from({ length: ROW_COUNT }, () => []);
  const widths = Array.from({ length: ROW_COUNT }, () => 0);

  for (const item of items) {
    let target = 0;
    for (let i = 1; i < ROW_COUNT; i++) {
      if (widths[i] < widths[target]) target = i;
    }
    const height = ROW_HEIGHTS[target];
    const width = pickHorizontalWidth(item);
    rows[target].push({
      item,
      width,
      height,
      tall: target === 0,
    });
    widths[target] += width + COL_GAP;
  }

  return rows;
}

function ProviderTile({
  item,
  tall,
  width = TILE_W,
  height,
  onPress,
}: {
  item: HomeProviderItem;
  tall: boolean;
  width?: number;
  height?: number;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { profile, serviceCount, category } = item;
  const isPremium = isProviderPremium(profile);
  const initial = profile.firstName.charAt(0).toUpperCase();
  const catLabel = categoryLabel(category, i18n.language);
  const topSkill = profile.skills[0];
  const distinction = distinctionLabel(profile.badge, isPremium, profile.isVerified, t);
  const tileHeight = height ?? (tall ? 196 : 168);

  const cardBody = (
    <View
      style={{
        flex: 1,
        padding: Spacing.three,
        paddingTop: isPremium ? Spacing.four : Spacing.three,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two }}>
        <View
          style={{
            width: isPremium ? 52 : 48,
            height: isPremium ? 52 : 48,
            borderRadius: isPremium ? 26 : 24,
            overflow: 'hidden',
            backgroundColor: isPremium ? colors.orbitWash : colors.iconWash,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isPremium ? 1.5 : BorderWidth.default,
            borderColor: isPremium ? BrandColors.gold : colors.borderStrong,
          }}
        >
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text
              style={[
                textStyle('featureHeading'),
                { color: colors.ink, fontSize: isPremium ? 20 : 18 },
              ]}
            >
              {initial}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamily('body', 'bold'),
                fontSize: 14,
                lineHeight: 18,
                color: colors.ink,
                flexShrink: 1,
              }}
            >
              {profile.firstName} {profile.lastName}
            </Text>
            {profile.isVerified ? (
              <CheckCircle size={14} color={colors.orbit} weight="fill" />
            ) : null}
            {isPremium ? <Crown size={13} color={BrandColors.gold} weight="fill" /> : null}
          </View>
          {(profile.city || profile.region) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} color={colors.muted} />
              <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted, flex: 1 }]}>
                {[profile.city, profile.region].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {profile.averageRating > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <StarRating rating={profile.averageRating} size={11} />
              <Text style={[textStyle('micro'), { color: colors.ink }]}>
                {formatRating(profile.averageRating)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {distinction ? (
        <View style={{ marginTop: Spacing.two }}>
          <Badge label={distinction} variant={isPremium ? 'premium' : 'verified'} />
        </View>
      ) : null}

      {catLabel ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: Spacing.two,
          }}
        >
          <CategoryIcon
            icon={category?.icon}
            slug={category?.slug}
            label={catLabel}
            size={14}
            color={colors.ink}
          />
          <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.ink, flexShrink: 1 }]}>
            {catLabel}
          </Text>
        </View>
      ) : null}

      {tall && profile.bio ? (
        <Text
          numberOfLines={2}
          style={[textStyle('micro'), { color: colors.slate, marginTop: Spacing.two, lineHeight: 16 }]}
        >
          {profile.bio}
        </Text>
      ) : topSkill ? (
        <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted, marginTop: Spacing.two }]}>
          {topSkill}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.two }}>
        <Briefcase size={11} color={colors.muted} weight="bold" />
        <Text style={[textStyle('micro'), { color: colors.muted }]}>
          {t('home.providerServices', { count: serviceCount })}
        </Text>
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height: tileHeight,
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {isPremium ? (
        <LinearGradient
          colors={[BrandColors.gold, colors.orbit, colors.clay]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: Radius.lg, padding: 1.5, flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: Radius.lg - 1,
              backgroundColor: colors.surfaceCard,
              overflow: 'hidden',
            }}
          >
            {cardBody}
          </View>
        </LinearGradient>
      ) : (
        <View
          style={{
            flex: 1,
            borderRadius: Radius.lg,
            backgroundColor: colors.surfaceCard,
            borderWidth: BorderWidth.default,
            borderColor: colors.borderStrong,
            overflow: 'hidden',
          }}
        >
          {cardBody}
        </View>
      )}
    </Pressable>
  );
}

function ProviderTileSkeleton({
  tall,
  width = TILE_W,
  height,
}: {
  tall: boolean;
  width?: number;
  height?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width,
        height: height ?? (tall ? 196 : 168),
        borderRadius: Radius.lg,
        backgroundColor: colors.surfaceCard,
        borderWidth: BorderWidth.default,
        borderColor: colors.borderStrong,
        padding: Spacing.three,
        gap: Spacing.two,
      }}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="80%" height={14} />
          <Skeleton width="55%" height={10} />
        </View>
      </View>
      <Skeleton width="60%" height={12} />
      <Skeleton width="40%" height={18} borderRadius={Radius.pill} />
    </View>
  );
}

/** Grille mosaïque prestataires — horizontale (défaut) ou 2 colonnes. */
export function ProviderGrid({
  items,
  onPressProvider,
  showHeader = false,
  title,
  actionLabel,
  onAction,
  skeletonRows = 3,
  emptyTitle,
  emptyDescription,
  layout = 'horizontal',
}: ProviderGridProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const gridRows = useMemo(() => {
    if (!items?.length) return [];
    const out: HomeProviderItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      out.push(items.slice(i, i + 2));
    }
    return out;
  }, [items]);

  const horizontalRows = useMemo(
    () => (items?.length ? buildHorizontalRows(items) : []),
    [items],
  );

  const resolvedEmptyTitle = emptyTitle ?? t('home.providersEmpty');
  const resolvedEmptyDescription = emptyDescription ?? t('home.providersEmptyDesc');

  const header = showHeader && title ? (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: PAGE_H_PAD,
        marginBottom: Spacing.four,
      }}
    >
      <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[textStyle('button'), { color: colors.ink }]}>{actionLabel} →</Text>
        </Pressable>
      ) : null}
    </View>
  ) : null;

  if (items !== undefined && items.length === 0) {
    return (
      <View style={showHeader ? { marginBottom: Spacing.eight } : undefined}>
        {header}
        <View style={{ paddingHorizontal: PAGE_H_PAD }}>
          <EmptyState compact title={resolvedEmptyTitle} description={resolvedEmptyDescription} />
        </View>
      </View>
    );
  }

  if (layout === 'horizontal') {
    const skeletonWidths = [
      [180, 156, 164],
      [140, 156, 148],
      [152, 140, 168],
    ] as const;

    const track = (
      <View style={{ height: TRACK_HEIGHT, justifyContent: 'space-between' }}>
        {ROW_HEIGHTS.map((rowH, rowIndex) => (
          <View
            key={rowIndex}
            style={{ flexDirection: 'row', gap: COL_GAP, height: rowH }}
          >
            {items === undefined
              ? skeletonWidths[rowIndex].map((w, i) => (
                  <ProviderTileSkeleton
                    key={`s-${rowIndex}-${i}`}
                    tall={rowIndex === 0}
                    width={w}
                    height={rowH}
                  />
                ))
              : (horizontalRows[rowIndex] ?? []).map((tile) => (
                  <ProviderTile
                    key={tile.item.profile._id}
                    item={tile.item}
                    tall={tile.tall}
                    width={tile.width}
                    height={tile.height}
                    onPress={() => onPressProvider(tile.item.profile._id)}
                  />
                ))}
          </View>
        ))}
      </View>
    );

    return (
      <View style={showHeader ? { marginBottom: Spacing.eight } : undefined}>
        {header}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          nestedScrollEnabled
          style={{ height: TRACK_HEIGHT }}
          contentContainerStyle={{
            paddingHorizontal: PAGE_H_PAD,
            height: TRACK_HEIGHT,
            alignItems: 'flex-start',
          }}
        >
          {track}
        </ScrollView>
      </View>
    );
  }

  if (layout === 'list') {
    return (
      <View style={showHeader ? { marginBottom: Spacing.eight } : undefined}>
        {header}
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: COL_GAP }}>
          {items === undefined
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <ProviderTileSkeleton
                  key={`list-sk-${i}`}
                  tall={false}
                  width={LIST_TILE_W}
                  height={LIST_TILE_H}
                />
              ))
            : items.map((item) => (
                <ProviderTile
                  key={item.profile._id}
                  item={item}
                  tall={false}
                  width={LIST_TILE_W}
                  height={LIST_TILE_H}
                  onPress={() => onPressProvider(item.profile._id)}
                />
              ))}
        </View>
      </View>
    );
  }

  return (
    <View style={showHeader ? { marginBottom: Spacing.eight } : undefined}>
      {header}

      {items === undefined ? (
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: COL_GAP }}>
          {Array.from({ length: skeletonRows }).map((_, row) => (
            <View key={row} style={{ flexDirection: 'row', gap: COL_GAP }}>
              <ProviderTileSkeleton tall={row % 2 === 0} />
              <ProviderTileSkeleton tall={row % 2 === 1} />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: COL_GAP }}>
          {gridRows.map((pair, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', gap: COL_GAP, alignItems: 'stretch' }}>
              {pair.map((item, colIndex) => (
                <ProviderTile
                  key={item.profile._id}
                  item={item}
                  tall={(rowIndex + colIndex) % 2 === 0}
                  onPress={() => onPressProvider(item.profile._id)}
                />
              ))}
              {pair.length === 1 ? <View style={{ width: TILE_W }} /> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
