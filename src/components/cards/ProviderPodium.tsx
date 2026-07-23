import { Image } from 'expo-image';
import { Crown, Star } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, View } from 'react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { categoryLabel, type HomeProviderItem } from '@/components/cards/providerShared';
import { EmptyState } from '@/components/ui/EmptyState';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { formatRating } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const SLOT_GAP = Spacing.six;
const SLOT_W = (SCREEN_W - PAGE_H_PAD * 2 - SLOT_GAP * 2) / 3;
/** Avatars plus petits que la colonne pour que le gap soit visible. */
const AVATAR_FIRST = Math.min(80, Math.round(SLOT_W * 0.72));
const AVATAR_SIDE = Math.min(58, Math.round(SLOT_W * 0.54));
/**
 * Descend 2e et 3e (même offset) pour que le 1er — couronne + avatar plus grand —
 * reste nettement plus haut.
 */
const SIDE_LIFT = Spacing.fourteen;

const PODIUM_RANKS = [
  { place: 2, avatar: AVATAR_SIDE, lift: SIDE_LIFT },
  { place: 1, avatar: AVATAR_FIRST, lift: 0 },
  { place: 3, avatar: AVATAR_SIDE, lift: SIDE_LIFT },
] as const;

const RUNNER_RANKS = [
  { place: 4, avatar: AVATAR_SIDE, lift: 0 },
  { place: 5, avatar: AVATAR_SIDE, lift: 0 },
  { place: 6, avatar: AVATAR_SIDE, lift: 0 },
] as const;

function podiumMedal(place: number, orbit: string): string {
  if (place === 1) return BrandColors.gold;
  if (place === 2) return orbit;
  return '#C67C3D';
}

function ordinalLabel(place: number, lang: string): string {
  if (lang.startsWith('ar')) return String(place);
  if (lang.startsWith('en')) {
    if (place === 1) return '1st';
    if (place === 2) return '2nd';
    if (place === 3) return '3rd';
    return `${place}th`;
  }
  return place === 1 ? '1er' : `${place}e`;
}

interface ProviderPodiumProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  items: HomeProviderItem[] | undefined;
  onPressProvider: (profileId: Id<'profiles'>) => void;
}

function RankColumn({
  item,
  place,
  avatarSize,
  lift,
  onPress,
}: {
  item: HomeProviderItem | undefined;
  place: number;
  avatarSize: number;
  lift: number;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isFirst = place === 1;
  const isPodium = place <= 3;
  const profile = item?.profile;

  if (!item || !profile) {
    return <View style={{ width: SLOT_W, marginTop: lift }} />;
  }

  const initial = profile.firstName.charAt(0).toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const specialty = categoryLabel(item.category, i18n.language);
  const medal = isPodium ? podiumMedal(place, colors.orbit) : colors.borderStrong;
  const badgeBg = isPodium ? medal : colors.iconWash;
  const onMedal = isFirst ? BrandColors.ink : isPodium ? colors.onOrbit : colors.ink;

  return (
    <View style={{ width: SLOT_W, alignItems: 'center', marginTop: lift }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={{ width: '100%', alignItems: 'center' }}>
          {isFirst ? (
            <Crown size={20} color={BrandColors.gold} weight="fill" style={{ marginBottom: 2 }} />
          ) : null}

          <Text
            style={{
              fontFamily: fontFamily('body', 'bold'),
              fontSize: 13,
              lineHeight: 16,
              color: colors.ink,
              marginBottom: Spacing.two,
            }}
          >
            {ordinalLabel(place, i18n.language)}
          </Text>

          <View
            style={{
              width: avatarSize + 6,
              height: avatarSize + 6,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: avatarSize + 6,
                height: avatarSize + 6,
                borderRadius: (avatarSize + 6) / 2,
                borderWidth: isFirst ? 2.5 : 1.5,
                borderColor: medal,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
              }}
            >
              <View
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  overflow: 'hidden',
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
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
                      { color: colors.ink, fontSize: isFirst ? 28 : 20 },
                    ]}
                  >
                    {initial}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                position: 'absolute',
                bottom: -4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: Spacing.two,
                height: 22,
                borderRadius: 11,
                backgroundColor: badgeBg,
                borderWidth: 1.5,
                borderColor: colors.canvas,
              }}
            >
              <Star size={11} color={isPodium ? onMedal : colors.rating} weight="fill" />
              <Text
                style={{
                  fontFamily: fontFamily('body', 'bold'),
                  fontSize: 11,
                  color: onMedal,
                }}
              >
                {formatRating(profile.averageRating)}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamily('body', 'bold'),
              fontSize: isFirst ? 15 : 13,
              lineHeight: 18,
              color: colors.ink,
              textAlign: 'center',
              marginTop: Spacing.three,
              width: '100%',
            }}
          >
            {fullName}
          </Text>

          {specialty ? (
            <Text
              numberOfLines={2}
              style={[
                textStyle('micro'),
                {
                  color: colors.muted,
                  textAlign: 'center',
                  width: '100%',
                  lineHeight: 14,
                },
              ]}
            >
              {specialty}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={t('tabs.profile')}
        hitSlop={8}
        style={({ pressed }) => [
          { marginTop: Spacing.two },
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text
          style={[
            textStyle('button'),
            {
              color: colors.orbit,
              textDecorationLine: 'underline',
              textAlign: 'center',
            },
          ]}
        >
          {t('tabs.profile')}
        </Text>
      </Pressable>
    </View>
  );
}

function RankRow({
  ranks,
  items,
  onPressProvider,
}: {
  ranks: readonly { place: number; avatar: number; lift: number }[];
  items: readonly (HomeProviderItem | undefined)[];
  onPressProvider: (profileId: Id<'profiles'>) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SLOT_GAP,
      }}
    >
      {ranks.map((rank, index) => (
        <RankColumn
          key={rank.place}
          item={items[index]}
          place={rank.place}
          avatarSize={rank.avatar}
          lift={rank.lift}
          onPress={() => {
            const target = items[index];
            if (target) onPressProvider(target.profile._id);
          }}
        />
      ))}
    </View>
  );
}

function PodiumSkeleton() {
  return (
    <View style={{ marginHorizontal: PAGE_H_PAD, gap: Spacing.six }}>
      {[PODIUM_RANKS, RUNNER_RANKS].map((ranks, row) => (
        <View
          key={row}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: SLOT_GAP,
          }}
        >
          {ranks.map((rank) => (
            <View
              key={rank.place}
              style={{ width: SLOT_W, alignItems: 'center', gap: Spacing.two, marginTop: rank.lift }}
            >
              <Skeleton width={28} height={14} />
              <Skeleton width={rank.avatar} height={rank.avatar} borderRadius={999} />
              <Skeleton width="85%" height={12} />
              <Skeleton width="70%" height={20} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Ranking top 6 — podium 1–3 + rangée 4–6. */
export function ProviderPodium({
  title,
  actionLabel,
  onAction,
  items,
  onPressProvider,
}: ProviderPodiumProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const topSix = items?.slice(0, 6) ?? [];
  const podiumOrdered = [topSix[1], topSix[0], topSix[2]] as const;
  const runners = [topSix[3], topSix[4], topSix[5]] as const;
  const hasRunners = runners.some(Boolean);

  return (
    <View style={{ marginBottom: Spacing.eight }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: PAGE_H_PAD,
          marginBottom: Spacing.five,
        }}
      >
        <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} style={{ opacity: 1 }}>
            <Text style={[textStyle('button'), { color: colors.ink }]}>{actionLabel} →</Text>
          </Pressable>
        ) : null}
      </View>

      {items === undefined ? (
        <PodiumSkeleton />
      ) : items.length === 0 ? (
        <View style={{ paddingHorizontal: PAGE_H_PAD }}>
          <EmptyState
            compact
            title={t('home.providersEmpty')}
            description={t('home.providersEmptyDesc')}
          />
        </View>
      ) : (
        <View style={{ marginHorizontal: PAGE_H_PAD, gap: Spacing.six }}>
          <RankRow ranks={PODIUM_RANKS} items={podiumOrdered} onPressProvider={onPressProvider} />
          {hasRunners ? (
            <RankRow ranks={RUNNER_RANKS} items={runners} onPressProvider={onPressProvider} />
          ) : null}
        </View>
      )}
    </View>
  );
}
