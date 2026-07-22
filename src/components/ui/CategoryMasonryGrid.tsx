import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { getCategoryVisual } from '@/lib/categoryTheme';
import {
  getCategoryCover,
  MASONRY_GAP,
  MASONRY_HEIGHT,
  pickMasonryHeight,
  sizeFromHeight,
  type MasonryTileSize,
} from '@/lib/categoryImages';
import { type CategoryCardData } from '@/components/ui/CategoryCard';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Shadows, Spacing } from '@/theme/tokens';

const TILE_RADIUS = Radius.lg;

interface LaidOut {
  item: CategoryCardData;
  size: MasonryTileSize;
  height: number;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Cascade irrégulière :
 * - hauteurs variées (hash stable + biais volume)
 * - placement colonnes parfois « déséquilibré » pour casser la régularité
 * - hero pleine largeur occasionnel (hash + volume)
 */
function buildMasonry(items: CategoryCardData[]): {
  heroes: LaidOut[];
  left: LaidOut[];
  right: LaidOut[];
} {
  const sorted = [...items].sort((a, b) => {
    const ac = a.serviceCount ?? 0;
    const bc = b.serviceCount ?? 0;
    const aEmpty = ac === 0 ? 1 : 0;
    const bEmpty = bc === 0 ? 1 : 0;
    if (aEmpty !== bEmpty) return aEmpty - bEmpty;
    if (bc !== ac) return bc - ac;
    return hashId(a.id) - hashId(b.id);
  });

  const laid: LaidOut[] = sorted.map((item) => {
    const count = item.serviceCount ?? 0;
    const height = pickMasonryHeight(item.id, count);
    return { item, height, size: sizeFromHeight(height) };
  });

  const heroCandidate = laid.find((t) => {
    const count = t.item.serviceCount ?? 0;
    if (count < 5) return false;
    return hashId(t.item.id) % 3 === 0;
  });

  const heroes: LaidOut[] = heroCandidate
    ? [{ ...heroCandidate, size: 'hero', height: MASONRY_HEIGHT.hero }]
    : [];
  const heroId = heroCandidate?.item.id;

  const rest = laid.filter((t) => t.item.id !== heroId);

  const left: LaidOut[] = [];
  const right: LaidOut[] = [];
  let leftH = 0;
  let rightH = 0;

  for (const tile of rest) {
    const block = tile.height + MASONRY_GAP;
    const h = hashId(tile.item.id);
    const forceLeft = h % 4 === 0;
    const forceRight = h % 4 === 1;

    if (forceLeft || (!forceRight && leftH <= rightH)) {
      left.push(tile);
      leftH += block;
    } else {
      right.push(tile);
      rightH += block;
    }
  }

  return { heroes, left, right };
}

interface CategoryMasonryTileProps {
  item: CategoryCardData;
  size: MasonryTileSize;
  height: number;
  width: number;
  onPress: () => void;
}

function CategoryMasonryTile({ item, size, height, width, onPress }: CategoryMasonryTileProps) {
  const visual = getCategoryVisual({
    icon: item.icon,
    slug: item.slug,
    label: item.label,
  });
  const cover = getCategoryCover({
    slug: item.slug,
    icon: item.icon,
    visualKey: visual.key,
  });
  const isEmpty = (item.serviceCount ?? 0) === 0;
  const isHero = size === 'hero';
  const isTall = height >= 220 || size === 'tall';
  const titleSize = isHero ? 20 : isTall ? 16 : 14;
  const titleLineHeight = isHero ? 24 : isTall ? 20 : 18;
  const { Icon, pastel } = visual;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: TILE_RADIUS,
        overflow: 'hidden',
        ...Shadows.nav,
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width,
          height,
          borderRadius: TILE_RADIUS,
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Image
          source={{ uri: cover }}
          style={{
            width,
            height,
            borderRadius: TILE_RADIUS,
          }}
          contentFit="cover"
          transition={200}
        />

        <LinearGradient
          colors={
            isEmpty
              ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']
              : ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.8)']
          }
          locations={isEmpty ? [0, 1] : [0, 0.5, 1]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
            borderRadius: TILE_RADIUS,
          }}
        />

        {isEmpty ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width,
              height,
              borderRadius: TILE_RADIUS,
              backgroundColor: 'rgba(20,20,19,0.3)',
            }}
          />
        ) : null}

        <View
          style={{
            position: 'absolute',
            top: Spacing.three,
            left: Spacing.three,
            width: isHero ? 40 : 34,
            height: isHero ? 40 : 34,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.22)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.28)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: isHero ? 28 : 24,
              height: isHero ? 28 : 24,
              borderRadius: 999,
              backgroundColor: pastel.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={isHero ? 15 : 13} color={pastel.fg} weight="bold" />
          </View>
        </View>

        {isEmpty ? (
          <View
            style={{
              position: 'absolute',
              top: Spacing.three,
              right: Spacing.three,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: Radius.pill,
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 11,
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              Bientôt disponible
            </Text>
          </View>
        ) : null}

        <View
          style={{
            position: 'absolute',
            left: Spacing.three,
            right: Spacing.three,
            bottom: Spacing.three,
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamily('body', 'bold'),
              fontSize: titleSize,
              lineHeight: titleLineHeight,
              color: '#FFFFFF',
              marginBottom: 4,
            }}
          >
            {item.label}
          </Text>
          <Text
            style={[
              textStyle('micro'),
              {
                color: isEmpty ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.82)',
              },
            ]}
          >
            {item.serviceCount ?? 0} service{(item.serviceCount ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function Column({
  tiles,
  width,
  onPressCategory,
}: {
  tiles: LaidOut[];
  width: number;
  onPressCategory: (id: string) => void;
}) {
  return (
    <View style={{ width, gap: MASONRY_GAP }}>
      {tiles.map((tile) => (
        <CategoryMasonryTile
          key={tile.item.id}
          item={tile.item}
          size={tile.size}
          height={tile.height}
          width={width}
          onPress={() => onPressCategory(tile.item.id)}
        />
      ))}
    </View>
  );
}

interface CategoryMasonryGridProps {
  categories: CategoryCardData[] | undefined;
  onPressCategory: (id: string) => void;
}

/** Grille masonry 2 colonnes — hauteurs irrégulières, gap resserré. */
export function CategoryMasonryGrid({
  categories,
  onPressCategory,
}: CategoryMasonryGridProps) {
  const [gridWidth, setGridWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== gridWidth) setGridWidth(w);
  };

  const layout = useMemo(
    () => (categories && categories.length > 0 ? buildMasonry(categories) : null),
    [categories],
  );

  const colWidth = gridWidth > 0 ? Math.floor((gridWidth - MASONRY_GAP) / 2) : 0;

  return (
    <View style={{ paddingHorizontal: PAGE_H_PAD }}>
      <View onLayout={onLayout} style={{ width: '100%' }}>
        {categories === undefined || gridWidth === 0 ? (
          <View style={{ gap: MASONRY_GAP }}>
            <View
              style={{
                height: MASONRY_HEIGHT.hero,
                borderRadius: TILE_RADIUS,
                backgroundColor: 'rgba(20,20,19,0.08)',
              }}
            />
            <View style={{ flexDirection: 'row', gap: MASONRY_GAP }}>
              <View
                style={{
                  flex: 1,
                  height: 224,
                  borderRadius: TILE_RADIUS,
                  backgroundColor: 'rgba(20,20,19,0.08)',
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: 158,
                  borderRadius: TILE_RADIUS,
                  backgroundColor: 'rgba(20,20,19,0.08)',
                }}
              />
            </View>
          </View>
        ) : layout ? (
          <View style={{ gap: MASONRY_GAP, width: gridWidth }}>
            {layout.heroes.map((tile) => (
              <CategoryMasonryTile
                key={tile.item.id}
                item={tile.item}
                size="hero"
                height={tile.height}
                width={gridWidth}
                onPress={() => onPressCategory(tile.item.id)}
              />
            ))}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: gridWidth,
              }}
            >
              <Column tiles={layout.left} width={colWidth} onPressCategory={onPressCategory} />
              <Column tiles={layout.right} width={colWidth} onPressCategory={onPressCategory} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
