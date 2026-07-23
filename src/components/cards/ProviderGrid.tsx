import React, { useMemo } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
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
  type HomeProviderItem,
} from '@/components/cards/providerShared';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP = Spacing.three;
const TILE_W = (SCREEN_W - PAGE_H_PAD * 2 - COL_GAP) / 2;

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
}

function ProviderTile({
  item,
  tall,
  onPress,
}: {
  item: HomeProviderItem;
  tall: boolean;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { profile, serviceCount, category } = item;
  const isPremium = profile.isPremium;
  const initial = profile.firstName.charAt(0).toUpperCase();
  const catLabel = categoryLabel(category, i18n.language);
  const topSkill = profile.skills[0];
  const distinction = distinctionLabel(profile.badge, isPremium, profile.isVerified, t);

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
            <Text style={[textStyle('featureHeading'), { color: colors.ink, fontSize: 18 }]}>
              {initial}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 14,
              lineHeight: 18,
              color: colors.ink,
            }}
          >
            {profile.firstName} {profile.lastName.charAt(0)}.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={11} color={colors.muted} weight="bold" />
            <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted, flex: 1 }]}>
              {profile.city}
            </Text>
          </View>
        </View>

        {isPremium ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: BrandColors.gold,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Crown size={13} color={BrandColors.ink} weight="fill" />
          </View>
        ) : profile.isVerified ? (
          <CheckCircle size={18} color={colors.orbit} weight="fill" />
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.one,
          marginTop: Spacing.two,
        }}
      >
        <StarRating rating={profile.averageRating} size={12} />
        <Text style={[textStyle('micro'), { color: colors.ink, fontFamily: fontFamily('body', 'medium') }]}>
          {formatRating(profile.averageRating)}
        </Text>
        <Text style={[textStyle('micro'), { color: colors.muted }]}>({profile.reviewCount})</Text>
      </View>

      {distinction ? (
        <View style={{ marginTop: Spacing.two }}>
          <Badge
            label={distinction}
            variant={isPremium ? 'premium' : profile.isVerified ? 'verified' : 'accent'}
          />
        </View>
      ) : null}

      {catLabel ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: Spacing.two,
            paddingHorizontal: Spacing.two,
            paddingVertical: 5,
            borderRadius: Radius.sm,
            backgroundColor: colors.iconWash,
            alignSelf: 'flex-start',
            maxWidth: '100%',
          }}
        >
          <CategoryIcon
            icon={category?.icon}
            slug={category?.slug}
            label={catLabel}
            size={14}
            color={colors.orbit}
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
        width: TILE_W,
        minHeight: tall ? 196 : 168,
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

function ProviderTileSkeleton({ tall }: { tall: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: TILE_W,
        minHeight: tall ? 196 : 168,
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

/** Grille mosaïque 2 colonnes — page talents ou sections détaillées. */
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
}: ProviderGridProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const rows = useMemo(() => {
    if (!items?.length) return [];
    const out: HomeProviderItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      out.push(items.slice(i, i + 2));
    }
    return out;
  }, [items]);

  const resolvedEmptyTitle = emptyTitle ?? t('home.providersEmpty');
  const resolvedEmptyDescription = emptyDescription ?? t('home.providersEmptyDesc');

  return (
    <View style={showHeader ? { marginBottom: Spacing.eight } : undefined}>
      {showHeader && title ? (
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
      ) : null}

      {items === undefined ? (
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: COL_GAP }}>
          {Array.from({ length: skeletonRows }).map((_, row) => (
            <View key={row} style={{ flexDirection: 'row', gap: COL_GAP }}>
              <ProviderTileSkeleton tall={row % 2 === 0} />
              <ProviderTileSkeleton tall={row % 2 === 1} />
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={{ paddingHorizontal: PAGE_H_PAD }}>
          <EmptyState compact title={resolvedEmptyTitle} description={resolvedEmptyDescription} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: COL_GAP }}>
          {rows.map((pair, rowIndex) => (
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
