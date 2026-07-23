import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import {
  CategoryCard,
  CategoryCardSkeleton,
  type CategoryCardData,
} from '@/components/ui/CategoryCard';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Spacing } from '@/theme/tokens';

const ROW_GAP = Spacing.three;
const COL_GAP = Spacing.three;

/** Hauteurs des 2 rangées (masonry horizontal décalé). */
const ROW_H_TOP = 128;
const ROW_H_BOTTOM = 118;
const TRACK_HEIGHT = ROW_H_TOP + ROW_GAP + ROW_H_BOTTOM;

type SizedTile = {
  item: CategoryCardData;
  width: number;
  height: number;
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Largeur selon volume + hash stable. */
function pickWidth(item: CategoryCardData): number {
  const count = item.serviceCount ?? 0;
  const h = hashId(item.id) % 3;
  if (count >= 6) return h === 0 ? 176 : 156;
  if (count >= 3) return h === 0 ? 148 : 132;
  return h === 0 ? 120 : 112;
}

/**
 * Masonry horizontal : scroll latéral, 2 rangées de hauteurs différentes,
 * largeurs variables. Hauteur du track fixée (pas d’expansion verticale).
 */
export function CategoryHorizontalMasonry({
  categories,
  onPressCategory,
  limit = 12,
}: {
  categories: CategoryCardData[] | undefined;
  onPressCategory: (id: string) => void;
  limit?: number;
}) {
  const { top, bottom } = useMemo(() => {
    if (!categories) return { top: [] as SizedTile[], bottom: [] as SizedTile[] };

    const sorted = [...categories].sort((a, b) => {
      const aEmpty = (a.serviceCount ?? 0) === 0 ? 1 : 0;
      const bEmpty = (b.serviceCount ?? 0) === 0 ? 1 : 0;
      if (aEmpty !== bEmpty) return aEmpty - bEmpty;
      return (b.serviceCount ?? 0) - (a.serviceCount ?? 0);
    });

    const list = sorted.slice(0, limit);
    const topRow: SizedTile[] = [];
    const bottomRow: SizedTile[] = [];
    let topW = 0;
    let bottomW = 0;

    list.forEach((item) => {
      const width = pickWidth(item);
      if (topW <= bottomW) {
        topRow.push({ item, width, height: ROW_H_TOP });
        topW += width + COL_GAP;
      } else {
        bottomRow.push({ item, width, height: ROW_H_BOTTOM });
        bottomW += width + COL_GAP;
      }
    });

    return { top: topRow, bottom: bottomRow };
  }, [categories, limit]);

  const track = (
    <View style={{ height: TRACK_HEIGHT, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', gap: COL_GAP, height: ROW_H_TOP }}>
        {categories === undefined
          ? [156, 132, 148].map((w, i) => (
              <CategoryCardSkeleton key={`t-${i}`} width={w} height={ROW_H_TOP} />
            ))
          : top.map((tile) => (
              <CategoryCard
                key={tile.item.id}
                item={tile.item}
                width={tile.width}
                height={tile.height}
                onPress={() => onPressCategory(tile.item.id)}
              />
            ))}
      </View>
      <View style={{ flexDirection: 'row', gap: COL_GAP, height: ROW_H_BOTTOM }}>
        {categories === undefined
          ? [120, 148, 132].map((w, i) => (
              <CategoryCardSkeleton key={`b-${i}`} width={w} height={ROW_H_BOTTOM} />
            ))
          : bottom.map((tile) => (
              <CategoryCard
                key={tile.item.id}
                item={tile.item}
                width={tile.width}
                height={tile.height}
                onPress={() => onPressCategory(tile.item.id)}
              />
            ))}
      </View>
    </View>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      style={{ height: TRACK_HEIGHT }}
      contentContainerStyle={{
        paddingHorizontal: PAGE_H_PAD,
        height: TRACK_HEIGHT,
        alignItems: 'flex-start',
      }}
    >
      {track}
    </ScrollView>
  );
}
