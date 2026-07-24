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
const LIST_TILE_W = SCREEN_W - PAGE_H_PAD * 2;
/** Hauteur indicative des squelettes liste (les vraies cards s’adaptent au contenu). */
const LIST_SKELETON_H = 132;

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
  /** `horizontal` (défaut) — scroll latéral, ~count/4 rangées. `grid` — 2 colonnes. `list` — liste verticale. */
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
  tall: boolean;
};

/** Nombre de rangées horizontales ≈ count / 4 (min. 1). */
function horizontalRowCount(count: number): number {
  return Math.max(1, Math.ceil(count / 4));
}

/** Répartit les tuiles sur count/4 rangées (plus courte d’abord). Hauteur = contenu. */
function buildHorizontalRows(items: HomeProviderItem[]): SizedTile[][] {
  const rowCount = horizontalRowCount(items.length);
  const rows: SizedTile[][] = Array.from({ length: rowCount }, () => []);
  const widths = Array.from({ length: rowCount }, () => 0);

  for (const item of items) {
    let target = 0;
    for (let i = 1; i < rowCount; i++) {
      if (widths[i] < widths[target]) target = i;
    }
    const width = pickHorizontalWidth(item);
    rows[target].push({
      item,
      width,
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
  onPress,
}: {
  item: HomeProviderItem;
  tall: boolean;
  width?: number;
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

  const cardBody = (
    <View
      style={{
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
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {isPremium ? (
        <LinearGradient
          colors={[BrandColors.gold, colors.orbit, colors.clay]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: Radius.lg,
            padding: 1.5,
          }}
        >
          <View
            style={{
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
  width = TILE_W,
}: {
  tall?: boolean;
  width?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width,
        minHeight: LIST_SKELETON_H,
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
    const skeletonCount = skeletonRows * 4;
    const skeletonRowCount = horizontalRowCount(skeletonCount);
    const skeletonRowsData = Array.from({ length: skeletonRowCount }, (_, rowIndex) =>
      Array.from({ length: 4 }, (_, i) => ({
        key: `s-${rowIndex}-${i}`,
        width: 140 + ((rowIndex + i) % 3) * 12,
      })),
    );

    const track = (
      <View style={{ gap: ROW_GAP }}>
        {items === undefined
          ? skeletonRowsData.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={{ flexDirection: 'row', gap: COL_GAP, alignItems: 'flex-start' }}
              >
                {row.map((sk) => (
                  <ProviderTileSkeleton
                    key={sk.key}
                    tall={rowIndex === 0}
                    width={sk.width}
                  />
                ))}
              </View>
            ))
          : horizontalRows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={{ flexDirection: 'row', gap: COL_GAP, alignItems: 'flex-start' }}
              >
                {row.map((tile) => (
                  <ProviderTile
                    key={tile.item.profile._id}
                    item={tile.item}
                    tall={tile.tall}
                    width={tile.width}
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
          contentContainerStyle={{
            paddingHorizontal: PAGE_H_PAD,
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
                  width={LIST_TILE_W}
                />
              ))
            : items.map((item) => (
                <ProviderTile
                  key={item.profile._id}
                  item={item}
                  tall={false}
                  width={LIST_TILE_W}
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
            <View key={row} style={{ flexDirection: 'row', gap: COL_GAP, alignItems: 'flex-start' }}>
              <ProviderTileSkeleton />
              <ProviderTileSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: COL_GAP }}>
          {gridRows.map((pair, rowIndex) => (
            <View
              key={rowIndex}
              style={{ flexDirection: 'row', gap: COL_GAP, alignItems: 'flex-start' }}
            >
              {pair.map((item) => (
                <ProviderTile
                  key={item.profile._id}
                  item={item}
                  tall={false}
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
